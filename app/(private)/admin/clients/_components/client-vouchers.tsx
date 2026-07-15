// components/client/client-vouchers.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MedalStarAlt, CheckCircle } from "@boxicons/react";
import { PackageVoucher } from "./package-voucher";

export type PackageType = {
  id: string;
  name: string;
  total_sessions: number;
  used_sessions: number;
  price: number | string;
  active: boolean;
  sessionDates?: string[];
};

interface ClientVouchersProps {
  clientId: string;
  clientName: string;
}

export function ClientVouchers({ clientId, clientName }: ClientVouchersProps) {
  const { data: packages, isLoading } = useSWR<PackageType[]>(
    `admin/clients/${clientId}/packages`,
    apiClient,
  );

  // Filtra apenas os pacotes que já foram 100% consumidos
  const completedPackages =
    packages?.filter((pkg) => pkg.used_sessions >= pkg.total_sessions) || [];

  const [voucherOpen, setVoucherOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<PackageType | null>(null);

  return (
    <>
      <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
        <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <MedalStarAlt className="h-5 w-5 text-primary" /> Histórico de
            Vouchers
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : completedPackages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col p-4 bg-card border border-border/50 rounded-2xl shadow-sm hover:border-primary/30 transition-all gap-3 animate-in fade-in zoom-in-95 duration-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-black text-foreground text-sm leading-tight truncate">
                        {pkg.name}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                        {pkg.total_sessions} Sessões Concluídas
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedPkg(pkg);
                      setVoucherOpen(true);
                    }}
                    variant="outline"
                    className="w-full h-9 rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs mt-1"
                  >
                    Abrir Comprovante
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center bg-muted/20 rounded-2xl border border-dashed border-border p-6 py-8">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <MedalStarAlt className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Nenhum voucher ainda
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal do Comprovante */}
      {selectedPkg && (
        <PackageVoucher
          open={voucherOpen}
          onOpenChange={(isOpen) => {
            setVoucherOpen(isOpen);
            if (!isOpen) setSelectedPkg(null);
          }}
          clientName={clientName}
          packageName={selectedPkg.name}
          totalSessions={selectedPkg.total_sessions}
          packageId={selectedPkg.id}
          sessionDates={selectedPkg.sessionDates || []}
        />
      )}
    </>
  );
}
