import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // O Mercado Pago envia notificações com type="payment" ou topic="payment"
    const topic = searchParams.get("topic") || body.type || body.action;
    const paymentId = searchParams.get("id") || body?.data?.id || body?.id;

    if (!paymentId || (topic && topic !== "payment" && topic !== "payment.created" && topic !== "payment.updated")) {
      return NextResponse.json({ received: true });
    }

    // Busca o agendamento associado a este mp_payment_id
    const appointment = await prisma.appointment.findFirst({
      where: { mp_payment_id: String(paymentId) },
      include: {
        client: true,
        service: true,
        transactions: true,
        organization: {
          include: { settings: true },
        },
      },
    });

    if (!appointment) {
      console.warn(`[WEBHOOK_MP] Agendamento não encontrado para paymentId: ${paymentId}`);
      return NextResponse.json({ received: true });
    }

    const accessToken = appointment.organization?.settings?.mp_access_token;
    if (!accessToken) {
      console.error(`[WEBHOOK_MP] Organização ${appointment.organization_id} sem mp_access_token`);
      return NextResponse.json({ received: true });
    }

    // Consulta os detalhes reais e oficiais do pagamento na API do Mercado Pago
    const paymentCheck = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!paymentCheck.ok) {
      console.error(`[WEBHOOK_MP] Erro ao consultar pagamento ${paymentId}`);
      return NextResponse.json({ received: true });
    }

    const paymentData = await paymentCheck.json();
    const status = paymentData.status;

    // Se o pagamento foi aprovado, atualiza o status do agendamento e registra o sinal no caixa
    if (status === "approved") {
      // 1. Idempotência: verifica se o sinal já foi registrado em Transaction
      const existingRevenue = appointment.transactions.find(
        (t) => t.type === "RECEITA" && t.status === "PAGO",
      );

      if (!existingRevenue) {
        // Busca o método de pagamento PIX da organização
        const pixMethod = await prisma.organizationPaymentMethod.findFirst({
          where: {
            organization_id: appointment.organization_id,
            type: "PIX",
            isActive: true,
          },
        });

        const grossAmount = Number(
          paymentData.transaction_amount ||
            Number(appointment.snapshot_service_price ?? appointment.service?.price ?? 0) / 2,
        );

        // Taxa cobrada pelo Mercado Pago (via fee_details ou net_received_amount)
        let feeAmount = 0;
        if (Array.isArray(paymentData.fee_details) && paymentData.fee_details.length > 0) {
          feeAmount = paymentData.fee_details.reduce(
            (acc: number, f: any) => acc + Number(f.amount || 0),
            0,
          );
        } else if (paymentData.net_received_amount && paymentData.transaction_amount) {
          feeAmount = Math.max(0, Number(paymentData.transaction_amount) - Number(paymentData.net_received_amount));
        }
        feeAmount = Math.max(0, Number(feeAmount.toFixed(2)));

        const approvalDate = paymentData.date_approved
          ? new Date(paymentData.date_approved)
          : new Date();
        const serviceName =
          appointment.snapshot_service_name || appointment.service?.name || "Serviço";
        const clientName = appointment.client?.name || "Cliente";

        // Cria a RECEITA do Sinal no Caixa
        const revenueTx = await prisma.transaction.create({
          data: {
            type: "RECEITA",
            description: `Sinal Online: ${serviceName}`,
            amount: grossAmount,
            date: approvalDate,
            status: "PAGO",
            organization_id: appointment.organization_id,
            appointment_id: appointment.id,
            client_id: appointment.client_id,
            payment_method_id: pixMethod?.id || null,
          },
        });

        // Integração Zibee (caso seja o cliente configurado)
        try {
          const { triggerZibeeSyncById } = await import(
            "@/lib/server/integrations/zibee.service"
          );
          triggerZibeeSyncById(revenueTx.id).catch(console.error);
        } catch (zibeeErr) {
          console.error("[ZIBEE_SYNC_ERROR]", zibeeErr);
        }

        // Se o Mercado Pago cobrou taxa, cria a DESPESA correspondente
        if (feeAmount > 0) {
          const feeTx = await prisma.transaction.create({
            data: {
              type: "DESPESA",
              description: `Taxa Mercado Pago: ${serviceName}`,
              amount: feeAmount,
              date: approvalDate,
              status: "PAGO",
              organization_id: appointment.organization_id,
              appointment_id: appointment.id,
              client_id: appointment.client_id,
              payment_method_id: pixMethod?.id || null,
            },
          });

          try {
            const { triggerZibeeSyncById } = await import(
              "@/lib/server/integrations/zibee.service"
            );
            triggerZibeeSyncById(feeTx.id).catch(console.error);
          } catch (zibeeErr) {
            console.error("[ZIBEE_SYNC_ERROR]", zibeeErr);
          }
        }
      }

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "CONFIRMADO",
          mp_payment_status: "approved",
          has_charge: true, // Ainda resta o saldo restante a pagar quando comparecer
        },
      });
      console.log(`[WEBHOOK_MP] Agendamento ${appointment.id} CONFIRMADO e Sinal registrado no financeiro.`);
    } else if (status === "rejected" || status === "cancelled") {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          mp_payment_status: status,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[WEBHOOK_MP_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
