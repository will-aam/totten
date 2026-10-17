import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

export interface CreatePixPaymentParams {
  organizationId: string;
  appointmentId: string;
  amount: number;
  description: string;
  payer: {
    email: string;
    firstName: string;
    phone?: string;
  };
}

export class MercadoPagoService {
  /**
   * Inicializa o cliente do Mercado Pago com o token do tenant ou lança erro.
   */
  private static async getClient(organizationId: string) {
    const settings = await prisma.settings.findUnique({
      where: { organization_id: organizationId },
      select: { mp_access_token: true },
    });

    const accessToken = settings?.mp_access_token;
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_NOT_CONNECTED");
    }

    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10000 },
    });

    return { client, accessToken };
  }

  /**
   * Cria uma cobrança PIX para o agendamento no Mercado Pago.
   */
  static async createPixPayment({
    organizationId,
    appointmentId,
    amount,
    description,
    payer,
  }: CreatePixPaymentParams) {
    const { client } = await this.getClient(organizationId);
    const payment = new Payment(client);

    // Validade de 15 minutos (ISO 8601)
    const expirationDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const body: any = {
      transaction_amount: Number(amount.toFixed(2)),
      description: description || "Sinal de Agendamento",
      payment_method_id: "pix",
      date_of_expiration: expirationDate,
      payer: {
        email: payer.email || "cliente@totten.com.br",
        first_name: payer.firstName,
      },
      external_reference: appointmentId,
      metadata: {
        appointment_id: appointmentId,
        organization_id: organizationId,
      },
      notification_url: `${process.env.NEXTAUTH_URL || "https://www.totten.com.br"}/api/webhooks/mercadopago`,
    };

    // Criação do pagamento com header de idempotência
    const res = await payment.create({
      body,
      requestOptions: {
        idempotencyKey: `pix_${appointmentId}_${Date.now()}`,
      },
    });

    const pointOfInteraction = res.point_of_interaction;
    const qrCodeData = pointOfInteraction?.transaction_data;

    // Atualiza o agendamento com o ID da transação no Mercado Pago
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        mp_payment_id: String(res.id),
        mp_payment_status: res.status || "pending",
      },
    });

    return {
      paymentId: res.id,
      status: res.status,
      qrCode: qrCodeData?.qr_code,
      qrCodeBase64: qrCodeData?.qr_code_base64,
      ticketUrl: qrCodeData?.ticket_url,
      expiresAt: expirationDate,
    };
  }

  /**
   * Consulta os dados de um pagamento pelo ID.
   */
  static async getPaymentStatus(organizationId: string, paymentId: string | number) {
    const { client } = await this.getClient(organizationId);
    const payment = new Payment(client);
    return await payment.get({ id: String(paymentId) });
  }
}
