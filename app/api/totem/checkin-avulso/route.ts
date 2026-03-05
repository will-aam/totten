// Rota da API do Totem: POST /api/totem/checkin-avulso
//
// Esta rota é chamada pelo Totem quando o cliente digita o CPF mas não há
// nenhum agendamento para hoje. Permite registrar uma presença avulsa (sem
// vínculo com Appointment ou Package).
//
// Contrato:
//   - Frontend envia: { cpf: string, organizationSlug: string }
//   - Resposta de sucesso:
//     {
//       "status": "CHECKIN_AVULSO_CREATED",
//       "checkInId": "...",
//       "clientName": "...",
//       "createdAt": "..."
//     }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cpf, organizationSlug } = body as {
      cpf?: string;
      organizationSlug?: string;
    };

    if (!cpf || !organizationSlug) {
      return NextResponse.json(
        { error: "CPF e organizationSlug são obrigatórios." },
        { status: 400 },
      );
    }

    // Remove pontuação do CPF para padronizar a busca
    const cpfLimpo = cpf.replace(/\D/g, "");

    // 1. Identifica a organização pelo slug
    const organizacao = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
    });

    if (!organizacao) {
      return NextResponse.json(
        { error: "Organização não encontrada." },
        { status: 404 },
      );
    }

    // 2. Localiza o cliente pelo CPF dentro da organização
    const cliente = await prisma.client.findFirst({
      where: {
        cpf: cpfLimpo,
        organization_id: organizacao.id,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    // 3. Cria o CheckIn avulso (sem vínculo com agendamento ou pacote)
    const checkIn = await prisma.checkIn.create({
      data: {
        client_id: cliente.id,
        appointment_id: null,
        package_id: null,
        organization_id: organizacao.id,
      },
    });

    return NextResponse.json({
      status: "CHECKIN_AVULSO_CREATED",
      checkInId: checkIn.id,
      clientName: cliente.name,
      createdAt: checkIn.date_time,
    });
  } catch (error) {
    console.error("[POST /api/totem/checkin-avulso] ERRO:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
