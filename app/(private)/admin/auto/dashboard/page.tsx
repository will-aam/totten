import { requireAuth } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/prisma";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { AutoDashboardClient } from "./auto-dashboard-client";
import { AppointmentStatus } from "@prisma/client";

export const metadata = {
  title: "Dashboard de Autoatendimento | Totten",
};

export default async function AutoDashboardPage() {
  const admin = await requireAuth();
  const prisma = getTenantPrisma(admin.organizationId);

  // Timezone São Paulo
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  const startOfDay = new Date(`${todayStr} 00:00:00 GMT-0300`);
  const tomorrow = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Buscas no banco
  const [
    totalSelfService,
    pendingRequests,
    approvedSelfService,
    paidPixAppointments,
    recentPending,
    orgSettings,
  ] = await Promise.all([
    // Total de agendamentos criados via Autoatendimento
    prisma.appointment.count({
      where: {
        organization_id: admin.organizationId,
        client: {
          source: "SELF_SERVICE",
        },
      },
    }),
    // Solicitações pendentes
    prisma.appointment.count({
      where: {
        organization_id: admin.organizationId,
        status: AppointmentStatus.SOLICITADO,
      },
    }),
    // Confirmados / Realizados vindos de autoatendimento
    prisma.appointment.count({
      where: {
        organization_id: admin.organizationId,
        client: {
          source: "SELF_SERVICE",
        },
        status: { in: [AppointmentStatus.CONFIRMADO, AppointmentStatus.REALIZADO] },
      },
    }),
    // Agendamentos pagos com Pix Mercado Pago neste mês (Agregação nativa)
    prisma.appointment.aggregate({
      where: {
        organization_id: admin.organizationId,
        created_at: { gte: startOfMonth },
        mp_payment_status: "approved",
      },
      _sum: {
        snapshot_service_price: true,
      },
    }),
    // Lista de solicitações pendentes recentes para ação rápida
    prisma.appointment.findMany({
      where: {
        organization_id: admin.organizationId,
        status: AppointmentStatus.SOLICITADO,
      },
      include: {
        client: true,
        service: true,
        professional: true,
      },
      orderBy: { date_time: "asc" },
      take: 6,
    }),
    // Configurações do autoatendimento (Mercado Pago, Pix, etc.)
    prisma.settings.findUnique({
      where: { organization_id: admin.organizationId },
      select: {
        pix_payment_type: true,
        mp_user_id: true,
        require_prepayment: true,
        pix_key: true,
      },
    }),
  ]);

  const totalPixDepositsMonth =
    Number(paidPixAppointments._sum.snapshot_service_price || 0) / 2;

  const conversionRate = totalSelfService > 0
    ? Math.round((approvedSelfService / totalSelfService) * 100)
    : 0;

  const data = {
    metrics: {
      totalSelfService,
      pendingRequests,
      approvedSelfService,
      conversionRate,
      totalPixDepositsMonth,
    },
    settings: {
      isMercadoPagoActive: !!(orgSettings?.mp_user_id && orgSettings?.pix_payment_type === "MERCADO_PAGO"),
      requirePrepayment: orgSettings?.require_prepayment ?? true,
      pixKey: orgSettings?.pix_key || "",
    },
    recentPending: JSON.parse(JSON.stringify(recentPending)),
  };

  return (
    <>
      <AdminHeader title="Dashboard de Autoatendimento" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
        <AutoDashboardClient initialData={data} />
      </div>
    </>
  );
}
