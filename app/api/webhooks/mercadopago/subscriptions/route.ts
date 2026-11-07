import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // Notificações do Mercado Pago de Assinaturas
    // Podem vir via query params ou body:
    // type: "subscription_preapproval" ou action: "updated"
    const type = searchParams.get("type") || body.type || body.action;
    const resourceId =
      searchParams.get("id") ||
      searchParams.get("data.id") ||
      body?.data?.id ||
      body?.id;

    console.log(`[WEBHOOK_SUBSCRIPTION] Recebido evento: type=${type}, id=${resourceId}`);

    if (!resourceId) {
      return NextResponse.json({ received: true });
    }

    const token = process.env.MP_PLATFORM_ACCESS_TOKEN;
    if (!token) {
      console.error("[WEBHOOK_SUBSCRIPTION] MP_PLATFORM_ACCESS_TOKEN não configurado no .env");
      return NextResponse.json({ received: true });
    }

    // Se o evento for sobre assinatura (preapproval)
    if (
      !type ||
      type.includes("subscription") ||
      type.includes("preapproval") ||
      type === "created" ||
      type === "updated"
    ) {
      // Consulta os detalhes da assinatura diretamente na API oficial
      const res = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Pode ser um pagamento comum (payment)
        console.warn(`[WEBHOOK_SUBSCRIPTION] Não foi possível obter preapproval ${resourceId}`);
      } else {
        const subData = await res.json();
        const organizationId = subData.external_reference;
        const mpStatus = subData.status; // 'authorized', 'paused', 'cancelled', 'pending'

        if (organizationId) {
          console.log(
            `[WEBHOOK_SUBSCRIPTION] Assinatura ${resourceId} da org ${organizationId}: status=${mpStatus}`
          );

          let systemStatus = "TRIAL";
          if (mpStatus === "authorized") {
            systemStatus = "ACTIVE";
          } else if (mpStatus === "paused") {
            systemStatus = "PAST_DUE";
          } else if (mpStatus === "cancelled") {
            systemStatus = "CANCELLED";
          }

          // Atualiza status e vigência
          const nextPaymentDate = subData.next_payment_date
            ? new Date(subData.next_payment_date)
            : null;

          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscription_status: systemStatus,
              mp_subscription_id: String(resourceId),
              ...(nextPaymentDate ? { current_period_end: nextPaymentDate } : {}),
            },
          });

          return NextResponse.json({ success: true, organizationId, systemStatus });
        }
      }
    }

    // Se for notificação de pagamento (cobrança recorrente autorizada / falhada)
    if (type === "payment" || type === "payment.created" || type === "payment.updated") {
      const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (payRes.ok) {
        const payData = await payRes.json();
        const organizationId = payData.external_reference;
        const paymentStatus = payData.status;

        if (organizationId) {
          if (paymentStatus === "approved") {
            await prisma.organization.update({
              where: { id: organizationId },
              data: {
                subscription_status: "ACTIVE",
              },
            });
          } else if (
            paymentStatus === "rejected" ||
            paymentStatus === "cancelled" ||
            paymentStatus === "refunded"
          ) {
            await prisma.organization.update({
              where: { id: organizationId },
              data: {
                subscription_status: "PAST_DUE",
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[WEBHOOK_SUBSCRIPTION_ERROR]", error);
    return NextResponse.json({ received: true, error: error?.message });
  }
}

