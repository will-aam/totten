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

    // Se o pagamento foi aprovado, atualiza o status do agendamento
    if (status === "approved") {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "CONFIRMADO",
          mp_payment_status: "approved",
          has_charge: true,
        },
      });
      console.log(`[WEBHOOK_MP] Agendamento ${appointment.id} CONFIRMADO com sucesso via PIX Mercado Pago.`);
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
