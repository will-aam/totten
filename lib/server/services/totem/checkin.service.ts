// lib/server/services/totem/checkin.service.ts
import { getTenantPrisma } from "@/lib/prisma";
import { triggerZibeeSyncById } from "@/lib/server/integrations/zibee.service";
import { createSettledRevenueWithFee } from "@/lib/server/services/payments/settlement.service";

export class TotemCheckInService {
  /**
   * Processa o check-in de um agendamento no Totem, realizando a baixa de pacote,
   * dedução de estoque e registro financeiro de forma estritamente atômica e transacional.
   */
  static async processCheckIn(appointmentId: string, organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    let packageInfo: { used: number; total: number } | null = null;
    const createdTxIds: string[] = [];

    // A GRANDE TRANSAÇÃO DO TOTEM (Isolamento total: leitura, travas e escrita atômica)
    const result = await prisma.$transaction(async (tx) => {
      // 1. BUSCA O AGENDAMENTO COM O SERVIÇO E INSUMOS DENTRO DO CONTEXTO DA TRANSAÇÃO
      const appt = await tx.appointment.findUnique({
        where: { id: appointmentId, organization_id: organizationId },
        include: {
          client: true,
          package: true,
          service: {
            include: {
              stock_items: {
                include: { stock_item: true },
              },
            },
          },
        },
      });

      if (!appt) {
        throw new Error("AGENDAMENTO_INVALIDO");
      }

      // Trava explícita para agendamentos cancelados
      if (appt.status === "CANCELADO") {
        throw new Error("AGENDAMENTO_CANCELADO");
      }

      // Trava para agendamentos que já foram feitos
      if (appt.status === "REALIZADO") {
        throw new Error("AGENDAMENTO_JA_PROCESSADO");
      }

      // Trava de segurança para pacotes inativos
      if (appt.package && appt.package.active === false) {
        throw new Error("PACOTE_INATIVO");
      }

      const existingCheckIn = await tx.checkIn.findFirst({
        where: { appointment_id: appt.id, organization_id: organizationId },
      });

      if (existingCheckIn) {
        throw new Error("CHECKIN_JA_REGISTRADO");
      }

      const orgSettings = await tx.settings.findUnique({
        where: { organization_id: organizationId },
        select: {
          auto_complete_on_checkin: true,
          auto_settle_on_checkin: true,
          default_payment_method_id: true,
        },
      });
      const autoComplete = orgSettings?.auto_complete_on_checkin ?? true;
      const autoSettle = orgSettings?.auto_settle_on_checkin ?? true;

      const loyaltySettings = await tx.loyaltySettings.findUnique({
        where: { organization_id: organizationId },
      });

      // 1. Cria o registro de Check-in
      const checkIn = await tx.checkIn.create({
        data: {
          appointment_id: appt.id,
          client_id: appt.client_id,
          package_id: appt.package_id ?? null,
          organization_id: organizationId,
          auto_processed: autoComplete, // dispara reversão de estoque/financeiro se for true
        },
      });

      if (autoComplete) {
        // 2. Atualiza Pacote e Agendamento
        if (appt.package) {
          // Utilizamos updateMany para injetar a condição de saldo no banco
          const pacoteUpdate = await tx.package.updateMany({
            where: {
              id: appt.package.id,
              organization_id: organizationId,
              used_sessions: { lt: appt.package.total_sessions },
            },
            data: { used_sessions: { increment: 1 } },
          });

          if (pacoteUpdate.count === 0) {
            throw new Error("SALDO_ESGOTADO");
          }

          packageInfo = {
            used: appt.package.used_sessions + 1,
            total: appt.package.total_sessions,
          };

          const apptUpdate = await tx.appointment.updateMany({
            where: {
              id: appt.id,
              organization_id: organizationId,
              status: { not: "REALIZADO" },
            },
            data: { status: "REALIZADO", has_charge: false },
          });

          if (apptUpdate.count === 0) {
            throw new Error("AGENDAMENTO_JA_PROCESSADO");
          }
        } else {
          // Fluxo para agendamento avulso (sem pacote)
          let paymentMethodEnum: any = null;
          let paymentMethodRecordId: string | null = null;

          if (autoSettle) {
            // Se o usuário selecionou uma forma específica (ex: Pix ou Cartão), busca ela
            let paymentMethod = null;
            if (orgSettings?.default_payment_method_id) {
              paymentMethod = await tx.organizationPaymentMethod.findUnique({
                where: { id: orgSettings.default_payment_method_id },
              });
            }

            if (paymentMethod) {
              paymentMethodEnum = paymentMethod.type;
              paymentMethodRecordId = paymentMethod.id;
            } else {
              // Padrão do Sistema: "À Vista" (sem amarrar a uma bandeira/taxa específica)
              paymentMethodEnum = "OUTRO";
              paymentMethodRecordId = null;
            }
          }

          // Busca receitas pagas já vinculadas ao agendamento (ex: sinal online Mercado Pago ou pagamento antecipado)
          const paidRevenues = await tx.transaction.findMany({
            where: {
              appointment_id: appt.id,
              organization_id: organizationId,
              type: "RECEITA",
              status: "PAGO",
            },
          });

          const totalPaid = paidRevenues.reduce(
            (acc: number, t: any) => acc + Number(t.amount),
            0
          );
          const apptPrice = Number(appt.snapshot_service_price ?? appt.service.price);
          const remainingAmount = Math.max(0, Number((apptPrice - totalPaid).toFixed(2)));

          const apptUpdate = await tx.appointment.updateMany({
            where: {
              id: appt.id,
              organization_id: organizationId,
              status: { not: "REALIZADO" },
            },
            data: {
              status: "REALIZADO",
              has_charge: remainingAmount > 0.01 && !autoSettle,
              payment_method: paymentMethodEnum || appt.payment_method,
            },
          });

          if (apptUpdate.count === 0) {
            throw new Error("AGENDAMENTO_JA_PROCESSADO");
          }

          // Se autoSettle estiver ativo e ainda houver saldo a quitar, gera a RECEITA do saldo restante
          if (autoSettle && remainingAmount > 0.01) {
            const apptName = appt.snapshot_service_name ?? appt.service.name;
            const desc =
              totalPaid > 0
                ? `Serviço Quitado (Saldo Restante): ${apptName}`
                : `Serviço Realizado: ${apptName}`;

            const { createdTxIds: newTxIds } = await createSettledRevenueWithFee({
              tx,
              organizationId,
              grossAmount: remainingAmount,
              description: desc,
              appointment_id: appt.id,
              client_id: appt.client_id,
              paymentMethodId: paymentMethodRecordId,
              paymentMethodEnum,
              status: "PAGO",
              baseDate: appt.date_time || new Date(),
            });
            createdTxIds.push(...newTxIds);
          }
        }

        // --- O CORAÇÃO DO SISTEMA FINANCEIRO E DE ESTOQUE ---
        const service = appt.service;

        // Trava de idempotência: só desconta estoque e gera despesa se ainda não foi debitado
        if (!appt.stock_deducted) {
          if (service.track_stock && service.stock_items.length > 0) {
            for (const item of service.stock_items) {
              const stockData = item.stock_item;
              const usedQty = item.quantity_used;

              // a) Baixa a quantidade física da prateleira
              await tx.stockItem.update({
                where: { id: stockData.id, organization_id: organizationId },
                data: { quantity: { decrement: usedQty } },
              });

              // b) Regra de Caixa
              if (!stockData.was_expensed) {
                const costOfUsedQty = Number(usedQty) * Number(stockData.unit_cost);

                if (costOfUsedQty > 0) {
                  const now = new Date();
                  const expTx = await tx.transaction.create({
                    data: {
                      type: "DESPESA",
                      description: `Custo de Insumo: ${stockData.name}`,
                      amount: costOfUsedQty,
                      date: now,
                      due_date: now,
                      settlement_date: now,
                      status: "PAGO",
                      organization_id: organizationId,
                      appointment_id: appt.id,
                    },
                  });
                  createdTxIds.push(expTx.id);
                }
              }
            }
          } else if (
            !service.track_stock &&
            service.material_cost &&
            Number(service.material_cost) > 0
          ) {
            // Fluxo de Custo Fixo de Material
            const now = new Date();
            const expTx = await tx.transaction.create({
              data: {
                type: "DESPESA",
                description: `Custo de Material: ${service.name}`,
                amount: service.material_cost,
                date: now,
                due_date: now,
                settlement_date: now,
                status: "PAGO",
                organization_id: organizationId,
                appointment_id: appt.id,
              },
            });
            createdTxIds.push(expTx.id);
          }

          // Marca o agendamento como já debitado no estoque
          await tx.appointment.update({
            where: { id: appt.id, organization_id: organizationId },
            data: { stock_deducted: true },
          });
        }
      }

      // 3. Adicionar pontos de fidelidade
      if (loyaltySettings?.is_active && loyaltySettings?.check_in_active) {
        const clientCurrent = await tx.client.findUnique({
          where: { id: appt.client_id },
          select: { loyalty_points: true }
        });
        const newPoints = Math.min(
          (clientCurrent?.loyalty_points || 0) + loyaltySettings.check_in_points,
          loyaltySettings.max_points
        );
        await tx.client.update({
          where: { id: appt.client_id },
          data: { loyalty_points: newPoints }
        });
      }

      // 4. Auditoria no Histórico do Cliente (ClientNote)
      if (appt.client_id) {
        const serviceName =
          appt.snapshot_service_name || appt.service?.name || "Serviço";
        const nowStr = new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date());

        let noteText = "";
        if (autoComplete) {
          noteText = `Ação: Check-in presencial no Totem (${serviceName} - ${nowStr}) finalizado como Realizado automaticamente.`;
          if (appt.package) {
            noteText += ` (Sessão ${appt.package.used_sessions + 1} de ${appt.package.total_sessions} consumida).`;
          }
        } else {
          noteText = `Ação: Check-in presencial no Totem (${serviceName} - ${nowStr}) registrado. Paciente aguardando na Recepção.`;
        }

        await tx.clientNote.create({
          data: {
            text: noteText,
            client_id: appt.client_id,
            organization_id: organizationId,
            date: new Date(),
          },
        });
      }

      return {
        checkIn,
        appt,
      };
    });

    // Disparar sincronização com Zibee para as transações criadas no check-in
    createdTxIds.forEach((txId) => triggerZibeeSyncById(txId).catch(console.error));

    return {
      clientName: result.appt.client.name,
      serviceName: result.appt.service.name,
      time: new Date(result.appt.date_time).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      checkInId: result.checkIn.id,
      package_info: packageInfo,
    };
  }

  /**
   * Processa o check-in avulso via CPF, validando o pacote ativo do cliente,
   * checando validade, criando o agendamento correspondente, dando baixa no estoque
   * e consumindo a sessão de forma estritamente atômica.
   */
  static async processCheckInByCpf(cpf: string, organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const cleanCpf = cpf.replace(/\D/g, "");
    const cpfFormatado =
      cleanCpf.length === 11
        ? cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
        : cpf;
    const cpfCandidates = Array.from(
      new Set([cpf.trim(), cleanCpf, cpfFormatado]),
    );

    // Busca o cliente dentro do escopo da organização com o pacote ativo e insumos do serviço
    const client = await prisma.client.findFirst({
      where: {
        cpf: { in: cpfCandidates },
        organization_id: organizationId,
      },
      include: {
        packages: {
          where: {
            active: true,
          },
          include: {
            service: {
              include: {
                stock_items: {
                  include: { stock_item: true },
                },
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
          take: 1,
        },
      },
    });

    if (!client) {
      throw new Error("CLIENT_NOT_FOUND");
    }

    if (!client.packages || client.packages.length === 0) {
      throw new Error("NO_ACTIVE_PACKAGE");
    }

    const activePackage = client.packages[0];

    // Trava de validade: impede check-in em pacotes vencidos
    if (activePackage.expires_at && new Date() > new Date(activePackage.expires_at)) {
      throw new Error("PACKAGE_EXPIRED");
    }

    // Trava prévia de sessões esgotadas
    if (activePackage.used_sessions >= activePackage.total_sessions) {
      throw new Error("PACKAGE_COMPLETED");
    }

    const loyaltySettings = await prisma.loyaltySettings.findUnique({
      where: { organization_id: organizationId },
    });

    const createdTxIds: string[] = [];
    const now = new Date();

    // Registra o agendamento, check-in, baixa de estoque e consumo atômico do pacote
    const result = await prisma.$transaction(async (tx) => {
      // 1. Trava atômica de concorrência com condição no banco (evita race condition de cliques duplos)
      const pacoteUpdate = await tx.package.updateMany({
        where: {
          id: activePackage.id,
          organization_id: organizationId,
          active: true,
          used_sessions: { lt: activePackage.total_sessions },
        },
        data: {
          used_sessions: { increment: 1 },
        },
      });

      if (pacoteUpdate.count === 0) {
        throw new Error("SALDO_ESGOTADO");
      }

      // Lê o saldo atualizado de forma consistente dentro da transação
      const updatedPkg = await tx.package.findUnique({
        where: { id: activePackage.id },
        select: { used_sessions: true, total_sessions: true },
      });

      const currentUsedSessions =
        updatedPkg?.used_sessions ?? (activePackage.used_sessions + 1);
      const willRemainActive =
        currentUsedSessions < activePackage.total_sessions;

      if (!willRemainActive) {
        await tx.package.update({
          where: { id: activePackage.id },
          data: { active: false },
        });
      }

      // 2. Criação do Agendamento REALIZADO (garante registro na agenda, jornada e histórico do cliente)
      const service = activePackage.service;
      const appt = await tx.appointment.create({
        data: {
          date_time: now,
          status: "REALIZADO",
          client_id: client.id,
          service_id: activePackage.service_id,
          package_id: activePackage.id,
          organization_id: organizationId,
          has_charge: false,
          session_number: currentUsedSessions,
          snapshot_service_name:
            activePackage.snapshot_service_name ?? service?.name,
          snapshot_service_price:
            activePackage.snapshot_service_price ?? service?.price,
          snapshot_service_duration:
            activePackage.snapshot_service_duration ?? service?.duration,
          stock_deducted: true,
          observations: "Check-in avulso via Totem (Autoatendimento CPF).",
        },
      });

      // 3. Criação do Check-in vinculado ao Agendamento
      const checkIn = await tx.checkIn.create({
        data: {
          appointment_id: appt.id,
          client_id: client.id,
          package_id: activePackage.id,
          organization_id: organizationId,
          auto_processed: true,
        },
      });

      // 4. Processamento de Insumos e Estoque
      if (service && service.track_stock && service.stock_items.length > 0) {
        for (const item of service.stock_items) {
          const stockData = item.stock_item;
          const usedQty = item.quantity_used;

          // Baixa a quantidade física na prateleira
          await tx.stockItem.update({
            where: { id: stockData.id, organization_id: organizationId },
            data: { quantity: { decrement: usedQty } },
          });

          // Registra despesa para insumos que não foram expensados na compra
          if (!stockData.was_expensed) {
            const costOfUsedQty =
              Number(usedQty) * Number(stockData.unit_cost);

            if (costOfUsedQty > 0) {
              const expTx = await tx.transaction.create({
                data: {
                  type: "DESPESA",
                  description: `Custo de Insumo: ${stockData.name}`,
                  amount: costOfUsedQty,
                  date: now,
                  due_date: now,
                  settlement_date: now,
                  status: "PAGO",
                  organization_id: organizationId,
                  appointment_id: appt.id,
                },
              });
              createdTxIds.push(expTx.id);
            }
          }
        }
      } else if (
        service &&
        !service.track_stock &&
        service.material_cost &&
        Number(service.material_cost) > 0
      ) {
        // Custo Fixo de Material
        const expTx = await tx.transaction.create({
          data: {
            type: "DESPESA",
            description: `Custo de Material: ${service.name}`,
            amount: service.material_cost,
            date: now,
            due_date: now,
            settlement_date: now,
            status: "PAGO",
            organization_id: organizationId,
            appointment_id: appt.id,
          },
        });
        createdTxIds.push(expTx.id);
      }

      // 5. Adicionar pontos de fidelidade
      if (loyaltySettings?.is_active && loyaltySettings?.check_in_active) {
        const clientCurrent = await tx.client.findUnique({
          where: { id: client.id },
          select: { loyalty_points: true },
        });
        const newPoints = Math.min(
          (clientCurrent?.loyalty_points || 0) +
            loyaltySettings.check_in_points,
          loyaltySettings.max_points,
        );
        await tx.client.update({
          where: { id: client.id },
          data: { loyalty_points: newPoints },
        });
      }

      return {
        checkIn,
        currentUsedSessions,
      };
    });

    // Disparar sincronização com Zibee para transações criadas no check-in
    createdTxIds.forEach((txId) =>
      triggerZibeeSyncById(txId).catch(console.error),
    );

    return {
      client: {
        id: client.id,
        name: client.name,
      },
      package_info: {
        used_sessions: result.currentUsedSessions,
        total_sessions: activePackage.total_sessions,
      },
      check_in: {
        id: result.checkIn.id,
        date_time: result.checkIn.date_time,
      },
    };
  }
}
