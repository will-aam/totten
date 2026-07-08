"use client";

import { AdminHeader } from "@/components/admin-header";
import { DashboardCards } from "./_components/dashboard-cards";
import { AgendaPreview } from "./_components/agenda-preview";
import { RecentCheckIns } from "./_components/recent-checkins";

export default function AdminDashboardPage() {
  return (
    <>
      <AdminHeader title="Dashboard" />

      {/* Container Principal */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
        <DashboardCards />

        <div className="flex flex-col xl:flex-row gap-6 mt-2">
          <AgendaPreview />
          <div className="flex-1">
            <RecentCheckIns />{" "}
          </div>
        </div>
      </div>
    </>
  );
}
