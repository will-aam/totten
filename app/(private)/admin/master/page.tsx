// app/(private)/admin/master/page.tsx
import { Suspense } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { getMasterPlatformData } from "@/app/actions/master";
import { MasterView } from "./_components/master-view";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function MasterLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tabs Skeleton */}
      <div className="flex items-center gap-6 border-b border-border/50 pb-3">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-11 flex-1 rounded-2xl" />
        <Skeleton className="h-11 w-40 rounded-2xl" />
      </div>

      {/* List Item Skeletons */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-3xl border border-border/60 bg-card/40 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-4 w-64 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function MasterContent() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/login");
  }

  // Verificação de segurança: apenas o Dono do Sistema
  try {
    const data = await getMasterPlatformData();
    return <MasterView initialData={data} />;
  } catch (error) {
    console.error("[MasterPage] Acesso negado:", error);
    redirect("/admin/dashboard");
  }
}

export default function MasterAdminPage() {
  return (
    <>
      <AdminHeader title="Gestão da Plataforma" />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <Suspense fallback={<MasterLoadingSkeleton />}>
          <MasterContent />
        </Suspense>
      </div>
    </>
  );
}

