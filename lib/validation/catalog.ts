// lib/validation/catalog.ts
import "server-only";
import { prisma } from "@/lib/prisma";

export type ValidationResult = {
  success: boolean;
  message: string;
  code?:
    | "HAS_APPOINTMENTS"
    | "HAS_ACTIVE_PACKAGES"
    | "SERVICE_INACTIVE"
    | "SOLD_PACKAGES_ACTIVE";
  details?: any;
};

// --- 1. VALIDAÇÃO DE SERVIÇO ---
export async function validateServiceDeactivation(
  serviceId: string,
  orgId: string,
): Promise<ValidationResult> {
  // Regra A: Possui agendamentos futuros?
  const futureAppointments = await prisma.appointment.count({
    where: {
      service_id: serviceId,
      organization_id: orgId,
      date_time: { gte: new Date() },
      status: { notIn: ["CANCELADO", "REALIZADO"] },
    },
  });

  if (futureAppointments > 0) {
    return {
      success: false,
      code: "HAS_APPOINTMENTS",
      message: `Este serviço não pode ser inativado pois possui ${futureAppointments} agendamento(s) futuro(s).`,
    };
  }

  // 🔥 NOVA REGRA VITAL: Algum cliente ainda tem um pacote ATIVO usando esse serviço?
  const activeSoldPackages = await prisma.package.count({
    where: {
      service_id: serviceId,
      organization_id: orgId,
      active: true, // Pacote vendido e em andamento
    },
  });

  if (activeSoldPackages > 0) {
    return {
      success: false,
      code: "SOLD_PACKAGES_ACTIVE",
      message: `Este serviço não pode ser inativado pois faz parte de ${activeSoldPackages} pacote(s) em uso por cliente(s). Encerre os pacotes primeiro.`,
    };
  }

  // Regra B: Possui pacotes (templates) ativos?
  const activeTemplates = await prisma.packageTemplate.count({
    where: { service_id: serviceId, organization_id: orgId, active: true },
  });

  if (activeTemplates > 0) {
    return {
      success: false,
      code: "HAS_ACTIVE_PACKAGES",
      message: `Este serviço está vinculado a ${activeTemplates} pacote(s) ativo(s). Deseja inativar o serviço e os pacotes vinculados?`,
    };
  }

  return { success: true, message: "OK" };
}

// --- 2. VALIDAÇÃO DE PACOTE ---
export async function validatePackageDeactivation(
  packageTemplateId: string,
  orgId: string,
): Promise<ValidationResult> {
  // Buscamos o template para usar como "fallback" na busca de dados legados
  const template = await prisma.packageTemplate.findUnique({
    where: { id: packageTemplateId, organization_id: orgId },
  });

  if (!template) {
    return { success: false, message: "Template não encontrado." };
  }

  // Regra C: Foi vendido para algum cliente e ainda tem sessões? (O cliente está "usando")
  // 🔥 Ajuste: usamos OR para pegar os pacotes novos (com ID) e os antigos (pelo nome, serviço e total de sessões)
  // Regra C: Foi vendido para algum cliente e ainda tem sessões?
  const activeSoldPackages = await prisma.package.count({
    where: {
      organization_id: orgId,
      active: true, // Significa que ainda tem sessões disponíveis/em curso
      OR: [
        { package_template_id: packageTemplateId },
        {
          // 🔥 FALLBACK MELHORADO: Ignoramos o "name" para não cair em falsos positivos se o nome for alterado
          service_id: template.service_id,
          total_sessions: template.total_sessions,
        },
      ],
    },
  });

  if (activeSoldPackages > 0) {
    return {
      success: false,
      code: "SOLD_PACKAGES_ACTIVE",
      message: `Este pacote está ativo e vinculado a ${activeSoldPackages} cliente(s). Para inativá-lo, é necessário primeiro encerrar os pacotes individuais desses clientes.`,
    };
  }

  return { success: true, message: "OK" };
}

// --- 3. VALIDAÇÃO DE ATIVAÇÃO ---
export async function validatePackageActivation(
  packageTemplateId: string,
  orgId: string,
): Promise<ValidationResult> {
  // Regra D: Só pode ativar o pacote se o serviço base estiver ativo
  const pkg = await prisma.packageTemplate.findUnique({
    where: { id: packageTemplateId, organization_id: orgId },
    include: { service: true },
  });

  if (pkg?.service && !pkg.service.active) {
    return {
      success: false,
      code: "SERVICE_INACTIVE",
      message: `Não é possível ativar este pacote: o serviço base '${pkg.service.name}' está inativo.`,
    };
  }

  return { success: true, message: "OK" };
}
