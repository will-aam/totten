import { requireAuth } from "@/lib/auth";
import { getTenantPrisma } from "@/lib/prisma";
import { RequestsClientView } from "./requests-client-view";
import { AppointmentStatus } from "@prisma/client";

export default async function RequestsPage() {
  const admin = await requireAuth();
  const prisma = getTenantPrisma(admin.organizationId);

  const pendingAppointments = await prisma.appointment.findMany({
    where: {
      organization_id: admin.organizationId,
      status: AppointmentStatus.PENDENTE,
      date_time: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    include: {
      client: true,
      service: true,
      package: true,
      professional: true,
    },
    orderBy: {
      date_time: "asc",
    },
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <RequestsClientView initialRequests={JSON.parse(JSON.stringify(pendingAppointments))} />
    </div>
  );
}
