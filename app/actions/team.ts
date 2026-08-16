// app/actions/team.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

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
        active: true,
        permissions: true, //  Trazendo as permissões do banco
        profession: true,
        bio: true,
        profile_image_url: true,
        instagram_url: true,
        show_instagram: true,
        show_on_site: true,
        created_at: true,
        services: { select: { id: true, name: true } },
        package_templates: { select: { id: true, name: true } },
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
  profession?: string;
  bio?: string;
  profile_image_url?: string;
  instagram_url?: string;
  show_instagram?: boolean;
  show_on_site?: boolean;
  service_ids?: string[];
  package_template_ids?: string[];
}) {
  try {
    const admin = await requireAuth();

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
      return { success: false, error: "Este e-mail já está em uso." };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.admin.create({
      data: {
        display_name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "COLLABORATOR",
        active: true,
        permissions: data.permissions || [], //  Salva as permissões garantindo que seja um array
        profession: data.profession || null,
        bio: data.bio || null,
        profile_image_url: data.profile_image_url || null,
        instagram_url: data.instagram_url || null,
        show_instagram: data.show_instagram !== undefined ? data.show_instagram : true,
        show_on_site: data.show_on_site !== undefined ? data.show_on_site : true,
        email_verified: true,
        organizations: { connect: { id: admin.organizationId } },
        services: {
          connect: data.service_ids?.map((id) => ({ id })) || [],
        },
        package_templates: {
          connect: data.package_template_ids?.map((id) => ({ id })) || [],
        },
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
    profession?: string;
    bio?: string;
    profile_image_url?: string;
    instagram_url?: string;
    show_instagram?: boolean;
    show_on_site?: boolean;
    service_ids?: string[];
    package_template_ids?: string[];
  },
) {
  try {
    const admin = await requireAuth();

    if (admin.role !== "OWNER") {
      return { success: false, error: "Sem permissão." };
    }

    const targetUser = await prisma.admin.findUnique({ where: { id } });
    const isOwner = targetUser?.role === "OWNER" && targetUser?.id === admin.id;

    //  Usando tipagem estrita do Prisma ao invés de 'any' para evitar quebras
    const updateData: Prisma.AdminUpdateInput = {
      display_name: data.name,
    };

    // O dono não pode alterar o próprio email, senha e permissões por aqui
    if (!isOwner) {
      updateData.email = data.email;
      if (data.permissions !== undefined) updateData.permissions = data.permissions;
      if (data.password && data.password.trim().length >= 6) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
    }

    if (data.profession !== undefined) updateData.profession = data.profession;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.profile_image_url !== undefined) updateData.profile_image_url = data.profile_image_url;
    if (data.instagram_url !== undefined) updateData.instagram_url = data.instagram_url;
    if (data.show_instagram !== undefined) updateData.show_instagram = data.show_instagram;
    if (data.show_on_site !== undefined) updateData.show_on_site = data.show_on_site;

    if (data.service_ids !== undefined) {
      updateData.services = { set: data.service_ids.map((id) => ({ id })) };
    }
    if (data.package_template_ids !== undefined) {
      updateData.package_templates = { set: data.package_template_ids.map((id) => ({ id })) };
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

    //  Proteção: O banco tem foreign keys (onDelete: SetNull no appointment).
    // Ou seja, se deletar, o histórico financeiro não quebra, mas o "profissional_id" vira nulo nos atendimentos passados.
    await prisma.admin.delete({ where: { id } });

    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao excluir." };
  }
}

export async function getCatalogOptions() {
  try {
    const admin = await requireAuth();

    const services = await prisma.service.findMany({
      where: { organization_id: admin.organizationId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const packages = await prisma.packageTemplate.findMany({
      where: { organization_id: admin.organizationId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return { success: true, services, packages };
  } catch (error) {
    console.error("Erro ao buscar opções de catálogo:", error);
    return { success: false, error: "Erro ao buscar opções." };
  }
}
