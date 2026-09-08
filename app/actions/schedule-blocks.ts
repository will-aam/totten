"use server";

import { prisma as db } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
export async function createScheduleBlock(data: {
  title: string;
  start_time: string;
  end_time: string;
  professional_id?: string;
}) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    const block = await db.scheduleBlock.create({
      data: {
        title: data.title,
        start_time: new Date(data.start_time),
        end_time: new Date(data.end_time),
        professional_id: data.professional_id,
        organization_id: organizationId,
      },
    });

    return { success: true, data: block };
  } catch (error: any) {
    console.error("Erro ao criar bloqueio de horário:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteScheduleBlock(id: string) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    await db.scheduleBlock.delete({
      where: {
        id,
        organization_id: organizationId,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao deletar bloqueio de horário:", error);
    return { success: false, error: error.message };
  }
}
