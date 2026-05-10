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
        organizations: { some: { id: admin.organizationId } },
      },
      select: {
        id: true,
        display_name: true,
        email: true,
        role: true,
        active: true, // 🔥 Adicionado
        permissions: true, // 🔥 Adicionado
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
  password?: string;
  permissions?: string[];
}) {
  try {
    const admin = await requireAuth();
    if (admin.role !== "OWNER")
      return { success: false, error: "Sem permissão." };
    if (!data.name || !data.email || !data.password)
      return { success: false, error: "Preencha todos os campos." };

    const existingAdmin = await prisma.admin.findUnique({
      where: { email: data.email },
    });
    if (existingAdmin)
      return { success: false, error: "Este e-mail já está em uso." };

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.admin.create({
      data: {
        display_name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "COLLABORATOR",
        active: true,
        permissions: data.permissions || [], // 🔥 Salva as permissões extras (vazio por padrão)
        email_verified: true,
        organizations: { connect: { id: admin.organizationId } },
      },
    });

    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao salvar." };
  }
}

export async function updateCollaborator(
  id: string,
  data: {
    name: string;
    email: string;
    password?: string;
    permissions?: string[];
  },
) {
  try {
    const admin = await requireAuth();
    if (admin.role !== "OWNER")
      return { success: false, error: "Sem permissão." };

    // Impede que o dono tire o próprio acesso de Owner ou altere seu e-mail por aqui
    const targetUser = await prisma.admin.findUnique({ where: { id } });
    if (targetUser?.role === "OWNER" && targetUser.id === admin.id) {
      return {
        success: false,
        error: "Edite seus dados em Configurações > Segurança.",
      };
    }

    const updateData: any = {
      display_name: data.name,
      email: data.email,
      permissions: data.permissions,
    };

    if (data.password && data.password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.admin.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao atualizar." };
  }
}

export async function toggleCollaboratorStatus(
  id: string,
  currentStatus: boolean,
) {
  try {
    const admin = await requireAuth();
    if (admin.role !== "OWNER")
      return { success: false, error: "Sem permissão." };
    if (id === admin.id)
      return { success: false, error: "Você não pode desativar a si mesmo." };

    await prisma.admin.update({
      where: { id },
      data: { active: !currentStatus },
    });

    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao mudar status." };
  }
}

export async function deleteCollaborator(id: string) {
  try {
    const admin = await requireAuth();
    if (admin.role !== "OWNER")
      return { success: false, error: "Sem permissão." };
    if (id === admin.id)
      return { success: false, error: "Você não pode excluir a si mesmo." };

    // 🔥 Proteção: O banco tem foreign keys (onDelete: SetNull no appointment).
    // Ou seja, se deletar, o histórico financeiro não quebra, mas o "profissional_id" vira nulo nos atendimentos passados.
    await prisma.admin.delete({ where: { id } });

    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao excluir." };
  }
}
