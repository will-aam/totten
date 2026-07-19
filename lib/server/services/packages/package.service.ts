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
      if (appointment.status === "REALIZADO" && appointment.package_id) {
        await tx.package.update({
          where: { id: appointment.package_id },
          data: { used_sessions: { decrement: 1 }, active: true },
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
    if (package_template_id) {
      const template = await prisma.packageTemplate.findUnique({
        where: {
          id: package_template_id,
          organization_id: organizationId,
        },
        select: { name: true },
      });
      if (template) {
        finalPackageName = template.name;
      }
    }

    // Transação de criação do pacote e financeiro
    const result = await prisma.$transaction(async (tx) => {
      const novoPacote = await tx.package.create({
        data: {
          name: finalPackageName,
          total_sessions: total_sessions,
          used_sessions: 0,
          price: price,
          client_id,
          service_id,
          organization_id: organizationId,
          active: true,
          package_template_id: package_template_id || null,
          snapshot_service_name: service.name,
          snapshot_service_price: service.price,
          snapshot_service_duration: service.duration,
        },
      });

      // 2. GERAR RECEITA À VISTA
      if (pay_upfront && payment_method && Number(price) > 0) {
        const orgPaymentMethod = await tx.organizationPaymentMethod.findFirst({
          where: {
            organization_id: organizationId,
            type: payment_method,
            isActive: true,
          },
        });

        let netAmount = Number(price);
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
        Number(price) > 0
      ) {
        const count = Number(installments_count);
        const amountPerInstallment = Number(price) / count;
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
}
