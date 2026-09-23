// lib/server/services/packages/package.service.ts
import { getTenantPrisma } from "@/lib/prisma";

export class PackageService {
  /**
   * Reverte um agendamento e devolve o saldo ao pacote, se aplicável.
   */
  static async fixAppointment(appointmentId: string, organizationId: string) {
    const prisma = getTenantPrisma(organizationId);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, organization_id: organizationId },
      include: { package: true },
    });

    if (!appointment) {
      throw new Error("NOT_FOUND");
    }

    await prisma.$transaction(async (tx) => {
      if (appointment.status === "REALIZADO" && appointment.package_id && appointment.package) {
        const isManuallyArchived = !appointment.package.active && (appointment.package.used_sessions < appointment.package.total_sessions);
        const finalActive = isManuallyArchived ? false : true;

        await tx.package.update({
          where: { id: appointment.package_id },
          data: { used_sessions: { decrement: 1 }, active: finalActive },
        });
      }

      await tx.checkIn.deleteMany({
        where: { appointment_id: appointment.id },
      });

      await tx.appointment.delete({ where: { id: appointment.id } });
    });

    return true;
  }

  /**
   * Cria um novo pacote de serviços para o cliente e gera as transações financeiras.
   */
  static async createPackage(organizationId: string, data: any) {
    const prisma = getTenantPrisma(organizationId);
    const {
      client_id,
      service_id,
      total_sessions,
      price,
      pay_upfront,
      payment_method,
      generate_installments,
      installments_count,
      package_template_id,
    } = data;

    // Validações de payload
    if (!client_id || !service_id || !total_sessions || price === undefined) {
      throw new Error("INVALID_DATA");
    }

    if (pay_upfront && !payment_method) {
      throw new Error("UPFRONT_PAYMENT_METHOD_REQUIRED");
    }

    if (!pay_upfront && generate_installments) {
      const count = Number(installments_count);
      if (!Number.isFinite(count) || count < 2 || count > 48) {
        throw new Error("INVALID_INSTALLMENTS_COUNT");
      }
    }

    // Validação de existência do cliente no tenant
    const client = await prisma.client.findUnique({
      where: { id: client_id, organization_id: organizationId },
    });

    if (!client) {
      throw new Error("CLIENT_NOT_FOUND");
    }

    // TRAVA DE SEGURANÇA: Impede sobreposição de pacotes
    const existingActivePackage = await prisma.package.findFirst({
      where: {
        client_id: client_id,
        organization_id: organizationId,
        active: true,
      },
    });

    if (existingActivePackage) {
      throw new Error("ACTIVE_PACKAGE_EXISTS");
    }

    const service = await prisma.service.findUnique({
      where: { id: service_id, organization_id: organizationId },
    });

    if (!service) {
      throw new Error("SERVICE_NOT_FOUND");
    }

    let finalPackageName = service.name;
    let finalPrice = Number(price);
    let finalTotalSessions = Number(total_sessions);

    let expiresAt: Date | null = null;

    if (package_template_id) {
      const template = await prisma.packageTemplate.findUnique({
        where: {
          id: package_template_id,
          organization_id: organizationId,
        },
        select: { name: true, price: true, total_sessions: true, validity_days: true },
      });
      if (template) {
        finalPackageName = template.name;
        // BLOQUEIO DE SEGURANÇA: Sobrescreve valores do frontend com a regra do banco de dados
        finalPrice = Number(template.price);
        finalTotalSessions = template.total_sessions;
        
        if (template.validity_days) {
          const settings = await prisma.settings.findUnique({
            where: { organization_id: organizationId },
            select: { package_validity_mode: true },
          });
          
          if (!settings || settings.package_validity_mode === "ACQUISITION") {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + template.validity_days);
          }
        }
      }
    }

    // Transação de criação do pacote e financeiro
    const result = await prisma.$transaction(async (tx) => {
      const novoPacote = await tx.package.create({
        data: {
          name: finalPackageName,
          total_sessions: finalTotalSessions,
          used_sessions: 0,
          price: finalPrice,
          client_id,
          service_id,
          organization_id: organizationId,
          active: true,
          package_template_id: package_template_id || null,
          expires_at: expiresAt,
          snapshot_service_name: service.name,
          snapshot_service_price: service.price,
          snapshot_service_duration: service.duration,
        },
      });

      // 2. GERAR RECEITA À VISTA
      if (pay_upfront && payment_method && finalPrice > 0) {
        const orgPaymentMethod = await tx.organizationPaymentMethod.findFirst({
          where: {
            organization_id: organizationId,
            type: payment_method,
            isActive: true,
          },
        });

        let netAmount = finalPrice;
        let feeDiscount = 0;

        if (orgPaymentMethod) {
          const feePercentage = Number(orgPaymentMethod.feePercentage);
          const feeFixed = Number(orgPaymentMethod.feeFixed);
          feeDiscount = netAmount * (feePercentage / 100) + feeFixed;
          netAmount = netAmount - feeDiscount;
        }

        let txDescription = `Venda de Pacote: ${service.name} (${client.name})`;
        if (feeDiscount > 0) {
          txDescription += ` (Taxa abatida: R$ ${feeDiscount.toFixed(2).replace(".", ",")})`;
        }

        await tx.transaction.create({
          data: {
            type: "RECEITA",
            description: txDescription,
            amount: netAmount,
            date: new Date(),
            status: "PAGO",
            organization_id: organizationId,
            client_id: client.id,
            package_id: novoPacote.id,
            payment_method_id: orgPaymentMethod?.id || null,
          },
        });
      }

      // 3. GERAR PARCELAS (CONTAS A RECEBER PENDENTE)
      else if (
        !pay_upfront &&
        generate_installments &&
        installments_count > 0 &&
        finalPrice > 0
      ) {
        const count = Number(installments_count);
        const amountPerInstallment = finalPrice / count;
        const baseDate = new Date();

        for (let i = 0; i < count; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(baseDate.getMonth() + i);

          await tx.transaction.create({
            data: {
              type: "RECEITA",
              description: `Parcela Pacote: ${service.name} (${client.name})`,
              amount: amountPerInstallment,
              date: dueDate,
              status: "PENDENTE",
              installment: `${i + 1}/${count}`,
              organization_id: organizationId,
              client_id: client.id,
              package_id: novoPacote.id,
            },
          });
        }
      }

      return novoPacote;
    });

    return result;
  }

  /**
   * Processa pacotes expirados criando agendamentos "VENCIDO"
   * para consumir o saldo remanescente.
   */
  static async processExpiredPackages(organizationId: string) {
    const prisma = getTenantPrisma(organizationId);
    
    // Buscar pacotes ativos, com data de expiração no passado, e que tenham sessões sobrando
    const expiredPackagesRaw = await prisma.package.findMany({
      where: {
        organization_id: organizationId,
        active: true,
        expires_at: { lt: new Date() },
      },
    });

    const expiredPackages = expiredPackagesRaw.filter(p => p.used_sessions < p.total_sessions);

    for (const pkg of expiredPackages) {
      const remaining = pkg.total_sessions - pkg.used_sessions;
      if (remaining > 0) {
        await prisma.$transaction(async (tx) => {
          // Criar N agendamentos fantasmas com status VENCIDO
          const newAppointments = [];
          for (let i = 0; i < remaining; i++) {
            newAppointments.push({
              date_time: new Date(),
              status: "VENCIDO" as any,
              has_charge: false,
              session_number: pkg.used_sessions + i + 1,
              observations: "Sessão expirada automaticamente (Valid. Pacote)",
              client_id: pkg.client_id,
              service_id: pkg.service_id,
              package_id: pkg.id,
              organization_id: organizationId,
              snapshot_service_name: pkg.snapshot_service_name,
              snapshot_service_price: pkg.snapshot_service_price,
              snapshot_service_duration: pkg.snapshot_service_duration,
            });
          }
          
          await tx.appointment.createMany({ data: newAppointments });

          // Atualizar o pacote para consumir as sessões e arquivá-lo (pois acabou)
          await tx.package.update({
            where: { id: pkg.id },
            data: {
              used_sessions: pkg.total_sessions,
              active: false, // Arquiva automaticamente ao consumir tudo
            },
          });
          
          // Registrar log
          await tx.clientNote.create({
            data: {
              client_id: pkg.client_id,
              organization_id: organizationId,
              text: `O pacote "${pkg.name}" expirou. Foram geradas ${remaining} sessões vencidas automaticamente.`,
              date: new Date(),
            }
          });
        });
      }
    }
  }
}
