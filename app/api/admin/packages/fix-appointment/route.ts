// app/api/admin/packages/fix-appointment/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const admin = await requireAuth();
    const { appointmentId } = await req.json();

    if (!appointmentId)
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

    // Encontra o agendamento e o pacote vinculado
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, organization_id: admin.organizationId },
      include: { package: true },
    });

    if (!appointment)
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // 1. Se estava como realizado, devolve o saldo ao pacote
      if (appointment.status === "REALIZADO" && appointment.package_id) {
        await tx.package.update({
          where: { id: appointment.package_id },
          data: { used_sessions: { decrement: 1 }, active: true },
        });
      }

      // 2. Deleta o Check-in se existir
      await tx.checkIn.deleteMany({
        where: { appointment_id: appointment.id },
      });

      // 3. Deleta o agendamento
      await tx.appointment.delete({ where: { id: appointment.id } });
    });

    revalidatePath("/admin/packages");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao deletar registro" },
      { status: 500 },
    );
  }
}
