// app/api/packages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !admin.organizationId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      client_id,
      service_id,
      total_sessions,
      price,
      pay_upfront,
      payment_method,
      generate_installments,
      installments_count,
    } = body;

    if (!client_id || !service_id || !total_sessions || price === undefined) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // ✅ Validações extras para evitar "venda inconsistente"
    if (pay_upfront) {
      if (!payment_method) {
        return NextResponse.json(
          { error: "Selecione a forma de pagamento para venda à vista." },
          { status: 400 },
        );
      }
    }

    if (!pay_upfront && generate_installments) {
      const count = Number(installments_count);
      if (!Number.isFinite(count) || count < 2 || count > 48) {
        return NextResponse.json(
          { error: "O número de parcelas deve ser entre 2 e 48." },
          { status: 400 },
        );
      }
    }

    const client = await prisma.client.findUnique({
      where: { id: client_id, organization_id: admin.organizationId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 },
      );
    }

    //  TRAVA DE SEGURANÇA SÊNIOR: Impede sobreposição de pacotes
    //const existingActivePackage = await prisma.package.findFirst({
    // where: {
    //  client_id: client_id,
    //  organization_id: admin.organizationId,
    //  active: true,
    // },
    // });

    //  if (existingActivePackage) {
    //   return NextResponse.json(
    //  {
    //       error:
    //    "Este cliente já possui um Pacote ativo. Encerre o atual antes de vender um novo pacote.",
    //    },
    //     { status: 400 },
    //    );
    //  }

    const service = await prisma.service.findUnique({
      where: { id: service_id, organization_id: admin.organizationId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const novoPacote = await tx.package.create({
        data: {
          name: service.name,
          total_sessions: total_sessions,
          used_sessions: 0,
          price: price,
          client_id,
          service_id,
          organization_id: admin.organizationId,
          active: true,
          //  SNAPSHOT INJETADO: A foto do serviço fica imortalizada no pacote!
          snapshot_service_name: service.name,
          snapshot_service_price: service.price,
          snapshot_service_duration: service.duration,
        },
      });

      // 2. GERAR RECEITA À VISTA
      if (pay_upfront && payment_method && Number(price) > 0) {
        const orgPaymentMethod = await tx.organizationPaymentMethod.findFirst({
          where: {
            organization_id: admin.organizationId,
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
            organization_id: admin.organizationId,
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
              organization_id: admin.organizationId,
              client_id: client.id,
              package_id: novoPacote.id,
            },
          });
        }
      }

      return novoPacote;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao vincular pacote:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
