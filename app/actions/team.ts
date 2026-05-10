"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getTeam() {
  try {
    const admin = await requireAuth();

    const team = await prisma.admin.findMany({
      where: {
        organizations: {
          some: { id: admin.organizationId },
        },
      },
      select: {
        id: true,
        display_name: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: "asc" },
    });

    return { success: true, data: team };
  } catch (error) {
    console.error("Erro ao buscar equipe:", error);
    return { success: false, error: "Erro ao buscar equipe." };
  }
}

export async function createCollaborator(data: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    const admin = await requireAuth();

    // Apenas donos podem criar novos usuários
    if (admin.role !== "OWNER") {
      return { success: false, error: "Sem permissão." };
    }

    if (!data.name || !data.email || !data.password) {
      return { success: false, error: "Preencha todos os campos." };
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { email: data.email },
    });

    if (existingAdmin) {
      return {
        success: false,
        error: "Este e-mail já está em uso no sistema.",
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.admin.create({
      data: {
        display_name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "COLLABORATOR", // 🔥 Define o cargo corretamente
        email_verified: true, // Já liberado, sem precisar de email de ativação
        organizations: {
          connect: { id: admin.organizationId },
        },
      },
    });

    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar colaborador:", error);
    return { success: false, error: "Erro inesperado ao salvar." };
  }
}
