import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * Associa um check-in pendente a um serviço ou pacote.
 *
 * POST /api/admin/checkins/pending/[checkInId]/associate
 * Body:
 * {
 * "serviceId": "srv_id" | null,
 * "packageId": "pkg_id" | null
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { checkInId: string } },
) {
  try {
    const admin = await requireAuth();
    const { checkInId } = params;
    const body = await req.json();

    const { serviceId, packageId } = body as {
      serviceId?: string | null;
      packageId?: string | null;
    };

    if (!checkInId) {
      return NextResponse.json(
        { error: "checkInId é obrigatório." },
        { status: 400 },
      );
    }

    if (!serviceId && !packageId) {
      return NextResponse.json(
        { error: "Informe serviceId ou packageId." },
        { status: 400 },
      );
    }

    // Buscar check-in pendente e validar organização
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
    });

    if (!checkIn || checkIn.organization_id !== admin.organizationId) {
      return NextResponse.json(
        { error: "Check-in não encontrado." },
        { status: 404 },
      );
    }

    if (checkIn.appointment_id) {
      return NextResponse.json(
        { error: "Check-in já está associado." },
        { status: 400 },
      );
    }

    const clientId = checkIn.client_id;

    if (!clientId) {
      return NextResponse.json(
        { error: "Check-in não possui client_id." },
        { status: 400 },
      );
    }

    // 1) Se escolher pacote: cria appointment vinculando package_id
    if (packageId) {
      const appointment = await prisma.$transaction(async (tx) => {
        const pkg = await tx.package.findUnique({
          where: { id: packageId },
        });

        if (
          !pkg ||
          pkg.organization_id !== admin.organizationId ||
          pkg.used_sessions >= pkg.total_sessions
        ) {
          throw new Error("Pacote inválido ou sem sessões disponíveis.");
        }

        const created = await tx.appointment.create({
          data: {
            date_time: checkIn.date_time,
            client_id: clientId,
            service_id: pkg.service_id,
            package_id: packageId,
            organization_id: admin.organizationId,
            status: "REALIZADO",
          },
        });

        // 🔥 CALCULA SE O PACOTE DEVE SER ARQUIVADO
        const newUsedSessions = pkg.used_sessions + 1;
        const willRemainActive = newUsedSessions < pkg.total_sessions;

        // Atualiza sessões e já inativa se bateu o limite
        await tx.package.update({
          where: { id: packageId },
          data: {
            used_sessions: newUsedSessions,
            active: willRemainActive, // 🎯 Correção aplicada aqui!
          },
        });

        await tx.checkIn.update({
          where: { id: checkInId },
          data: {
            appointment_id: created.id,
            package_id: packageId,
          },
        });

        return created;
      });

      return NextResponse.json({ success: true, appointment });
    }

    // 2) Se escolher serviço avulso: valida serviço
    const service = await prisma.service.findUnique({
      where: { id: serviceId! },
    });

    if (!service || service.organization_id !== admin.organizationId) {
      return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          date_time: checkIn.date_time,
          client_id: clientId,
          service_id: serviceId!,
          organization_id: admin.organizationId,
          status: "REALIZADO",
          has_charge: true,
        },
      });

      await tx.checkIn.update({
        where: { id: checkInId },
        data: {
          appointment_id: created.id,
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error(
      "[POST /api/admin/checkins/pending/[checkInId]/associate] ERRO:",
      error,
    );

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Erro ao associar check-in." },
      { status: 500 },
    );
  }
}
