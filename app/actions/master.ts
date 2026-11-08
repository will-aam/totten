// app/actions/master.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireSystemOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export interface MasterClinicItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  trial_days_left: number | null;
  created_at: string;
  company_name: string;
  trade_name: string;
  document: string;
  responsible_name: string;
  responsible_first_name: string;
  responsible_last_name: string;
  responsible_display_name: string;
  phone_whatsapp: string;
  phone_landline: string;
  email_admin: string;
  address: string;
  owner: {
    id: string;
    email: string;
    email_verified: boolean;
    active: boolean;
    created_at: string;
  } | null;
  professionals_count: number;
  appointments_count: number;
  clients_count: number;
  services_count: number;
}

export interface MasterPlatformSummary {
  totalClinics: number;
  totalProfessionals: number;
  verifiedEmailsCount: number;
  pendingEmailsCount: number;
  trialCount: number;
  activeCount: number;
  otherPlansCount: number;
}

export interface MasterPlatformData {
  summary: MasterPlatformSummary;
  clinics: MasterClinicItem[];
}

const MASTER_ORG_ID = "cmw6jrh6t0000cgxgwi7hi285";

/**
 * 📊 Busca os dados consolidados de todas as clínicas clientes para o Dono do Sistema
 */
export async function getMasterPlatformData(): Promise<MasterPlatformData> {
  await requireSystemOwner();

  // Busca todas as organizações que NÃO são a organização do dono master
  const rawOrganizations = await prisma.organization.findMany({
    where: {
      id: { not: MASTER_ORG_ID },
    },
    include: {
      settings: true,
      admins: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          display_name: true,
          email: true,
          email_verified: true,
          role: true,
          active: true,
          created_at: true,
        },
        orderBy: { created_at: "asc" },
      },
      _count: {
        select: {
          admins: true,
          appointments: true,
          clients: true,
          services: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const now = new Date().getTime();

  const clinics: MasterClinicItem[] = rawOrganizations.map((org) => {
    const owner = org.admins.find((a) => a.role === "OWNER") || org.admins[0] || null;
    const settings = org.settings;

    let trialDaysLeft: number | null = null;
    if (org.trial_ends_at) {
      const diffMs = new Date(org.trial_ends_at).getTime() - now;
      trialDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    const respFirst = settings?.responsible_first_name || owner?.first_name || "";
    const respLast = settings?.responsible_last_name || owner?.last_name || "";
    const respDisplay = settings?.responsible_display_name || owner?.display_name || "";
    const respFull = settings?.responsible_name || [respFirst, respLast].filter(Boolean).join(" ") || "Não informado";

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan || "TRIAL",
      subscription_status: org.subscription_status || "TRIAL",
      trial_ends_at: org.trial_ends_at ? org.trial_ends_at.toISOString() : null,
      trial_days_left: trialDaysLeft,
      created_at: org.created_at.toISOString(),
      company_name: settings?.company_name || org.name,
      trade_name: settings?.trade_name || org.name,
      document: settings?.document || "",
      responsible_name: respFull,
      responsible_first_name: respFirst,
      responsible_last_name: respLast,
      responsible_display_name: respDisplay,
      phone_whatsapp: settings?.phone_whatsapp || "",
      phone_landline: settings?.phone_landline || "",
      email_admin: settings?.email_admin || owner?.email || "",
      address: settings?.address || "",
      owner: owner
        ? {
            id: owner.id,
            email: owner.email,
            email_verified: owner.email_verified,
            active: owner.active,
            created_at: owner.created_at.toISOString(),
          }
        : null,
      professionals_count: org._count.admins,
      appointments_count: org._count.appointments,
      clients_count: org._count.clients,
      services_count: org._count.services,
    };
  });

  const totalClinics = clinics.length;
  const verifiedEmailsCount = clinics.filter((c) => c.owner?.email_verified).length;
  const pendingEmailsCount = totalClinics - verifiedEmailsCount;
  const totalProfessionals = clinics.reduce((acc, c) => acc + c.professionals_count, 0);
  const trialCount = clinics.filter((c) => c.plan === "TRIAL" || c.subscription_status === "TRIAL").length;
  const activeCount = clinics.filter((c) => c.subscription_status === "ACTIVE").length;
  const otherPlansCount = totalClinics - trialCount - activeCount;

  return {
    summary: {
      totalClinics,
      totalProfessionals,
      verifiedEmailsCount,
      pendingEmailsCount,
      trialCount,
      activeCount,
      otherPlansCount,
    },
    clinics,
  };
}

/**
 * ⚡ Permite ao Dono do Sistema ativar manualmente o e-mail de um cliente
 */
export async function manuallyVerifyAdminEmail(adminId: string) {
  await requireSystemOwner();

  if (!adminId) {
    return { success: false, error: "ID do administrador não fornecido." };
  }

  try {
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        email_verified: true,
        verification_token: null,
      },
    });

    revalidatePath("/admin/master");
    return { success: true, message: "E-mail ativado com sucesso pelo administrador master!" };
  } catch (error: any) {
    console.error("[manuallyVerifyAdminEmail] Erro:", error);
    return { success: false, error: "Não foi possível verificar o e-mail." };
  }
}

/**
 * ✉️ Permite ao Dono do Sistema reenviar o e-mail de ativação para um cliente
 */
export async function resendClientActivationEmail(adminId: string) {
  await requireSystemOwner();

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, email_verified: true },
    });

    if (!admin) {
      return { success: false, error: "Administrador não encontrado." };
    }

    if (admin.email_verified) {
      return { success: false, error: "Este e-mail já foi ativado." };
    }

    const verificationToken = randomBytes(32).toString("hex");

    await prisma.admin.update({
      where: { id: admin.id },
      data: { verification_token: verificationToken },
    });

    await sendVerificationEmail(admin.email, verificationToken);

    return {
      success: true,
      message: `E-mail de ativação reenviado para ${admin.email}!`,
    };
  } catch (error: any) {
    console.error("[resendClientActivationEmail] Erro:", error);
    return { success: false, error: "Falha ao reenviar e-mail de ativação." };
  }
}

/**
 * ⏳ Prorroga o período de Trial de uma clínica cliente
 */
export async function extendClientTrial(organizationId: string, additionalDays: number) {
  await requireSystemOwner();

  if (!organizationId || !additionalDays || additionalDays <= 0) {
    return { success: false, error: "Dados inválidos para prorrogação." };
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, trial_ends_at: true },
    });

    if (!org) {
      return { success: false, error: "Clínica não encontrada." };
    }

    const baseDate = org.trial_ends_at && new Date(org.trial_ends_at) > new Date()
      ? new Date(org.trial_ends_at)
      : new Date();

    const newTrialEndsAt = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        trial_ends_at: newTrialEndsAt,
        subscription_status: "TRIAL",
      },
    });

    revalidatePath("/admin/master");
    return {
      success: true,
      message: `Período de teste prorrogado por mais ${additionalDays} dias com sucesso!`,
    };
  } catch (error: any) {
    console.error("[extendClientTrial] Erro:", error);
    return { success: false, error: "Erro ao prorrogar o período de teste." };
  }
}

