// Rota da API do Totem: POST /api/totem/search
//
// Esta rota é chamada pelo Totem de autoatendimento quando o cliente digita o CPF.
//
// Contrato:
//   - Frontend envia: { cpf: string, organizationSlug: string }
//   - Se existir agendamento hoje: realiza check-in e responde { status: "FOUND", appointment: { ... } }
//   - Se não existir: responde { status: "NOT_FOUND" }
//
// Após receber FOUND, o frontend deve redirecionar para /totem/success com os parâmetros
// relevantes (nome, sessões usadas/total). A lógica de routing fica no frontend.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cpf, organizationSlug } = body as {
      cpf?: string;
      organizationSlug?: string;
    };

    // Validação básica dos campos obrigatórios
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
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // 3. Define a janela de tempo "hoje"
    // Atenção: utiliza o fuso horário do servidor. Em ambientes multi-fuso,
    // considere ajustar usando uma biblioteca como date-fns-tz com o fuso configurado
    // na Organization (campo a adicionar no schema) ou dayjs/timezone.
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);
    const fimDoDia = new Date();
    fimDoDia.setHours(23, 59, 59, 999);

    // 4. Busca agendamento de hoje com status PENDENTE ou CONFIRMADO
    const agendamento = await prisma.appointment.findFirst({
      where: {
        client_id: cliente.id,
        organization_id: organizacao.id,
        date_time: {
          gte: inicioDoDia,
          lte: fimDoDia,
        },
        // Considera apenas agendamentos ativos (exclui CANCELADO e REALIZADO)
        status: { in: ["PENDENTE", "CONFIRMADO"] },
      },
      include: {
        service: { select: { name: true } },
      },
    });

    // 5. Se não houver agendamento hoje, retorna NOT_FOUND
    if (!agendamento) {
      return NextResponse.json({ status: "NOT_FOUND" });
    }

    // 6. Realiza o check-in em transação para garantir consistência:
    //    a) Cria o CheckIn vinculado ao agendamento
    //    b) Atualiza o status do agendamento para REALIZADO
    //    c) Se houver pacote: incrementa used_sessions (sem ultrapassar total_sessions)
    //       Se for avulso: marca has_charge = true para sinalizar cobrança pendente
    await prisma.$transaction(async (tx) => {
      // a) Cria o CheckIn vinculado ao agendamento
      //    - Se for sessão de pacote: inclui package_id
      //    - Se for avulso: package_id permanece null
      await tx.checkIn.create({
        data: {
          appointment_id: agendamento.id,
          client_id: cliente.id,
          package_id: agendamento.package_id ?? null,
          organization_id: organizacao.id,
        },
      });

      if (agendamento.package_id) {
        // c) Sessão de pacote: incrementa sessões usadas, respeitando o total máximo
        const pacote = await tx.package.findUnique({
          where: { id: agendamento.package_id },
        });

        if (pacote && pacote.used_sessions < pacote.total_sessions) {
          await tx.package.update({
            where: { id: agendamento.package_id },
            data: { used_sessions: { increment: 1 } },
          });
        }

        // b) Atualiza o status do agendamento para REALIZADO (sessão de pacote)
        await tx.appointment.update({
          where: { id: agendamento.id },
          data: { status: "REALIZADO" },
        });
      } else {
        // b+c) Agendamento avulso: marca REALIZADO e cobrança pendente em uma operação
        await tx.appointment.update({
          where: { id: agendamento.id },
          data: { status: "REALIZADO", has_charge: true },
        });
      }
    });

    // 7. Retorna os dados do agendamento para o frontend do Totem
    return NextResponse.json({
      status: "FOUND",
      appointment: {
        id: agendamento.id,
        date_time: agendamento.date_time,
        service_name: agendamento.service.name,
        client_name: cliente.name,
        package_id: agendamento.package_id ?? null,
      },
    });
  } catch (error) {
    console.error("Erro na busca do Totem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
