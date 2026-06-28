"use client";

import { use, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PendingCheckInDetail = {
  id: string;
  clientId: string | null;
  clientName: string;
  dateTime: string;
};

type Service = { id: string; name: string };
type Package = {
  id: string;
  name: string;
  total_sessions: number;
  used_sessions: number;
};

export default function PendingCheckInAssociationPage({
  params,
}: {
  params: Promise<{ checkInId: string }>;
}) {
  const { checkInId } = use(params);
  const router = useRouter();

  const { data, isLoading } = useSWR<{
    checkIn: PendingCheckInDetail | null;
  }>(`/api/admin/checkins/pending/${checkInId}`, fetcher);

  const checkIn = data?.checkIn ?? null;

  const { data: servicesData, isLoading: isLoadingServices } = useSWR<{
    services: Service[];
  }>(`/api/admin/services`, fetcher);

  const { data: packagesData, isLoading: isLoadingPackages } = useSWR<{
    packages: Package[];
  }>(
    checkIn?.clientId
      ? `/api/admin/clients/${checkIn.clientId}/packages`
      : null,
    fetcher,
  );

  const services = servicesData?.services ?? [];
  const packages = packagesData?.packages ?? [];

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <>
        <AdminHeader title="Associar Check-in" />
        <div className="p-6 max-w-3xl mx-auto">
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </>
    );
  }

  if (!checkIn) {
    return (
      <>
        <AdminHeader title="Associar Check-in" />
        <div className="p-6 max-w-3xl mx-auto text-center">
          <p className="text-muted-foreground">
            Check-in pendente não encontrado.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </>
    );
  }

  const date = new Date(checkIn.dateTime);

  async function handleAssociate() {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const res = await fetch(
        `/api/admin/checkins/pending/${checkInId}/associate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: selectedServiceId,
            packageId: selectedPackageId,
          }),
        },
      );

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Erro ao associar.");
      }

      router.push("/admin/dashboard");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <AdminHeader title="Associar Check-in" />
      <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Check-in pendente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div>
              <span className="font-medium">Cliente:</span> {checkIn.clientName}
            </div>
            <div>
              <span className="font-medium">Data:</span>{" "}
              {date.toLocaleDateString("pt-BR")} às{" "}
              {date.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escolher serviço (avulso)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoadingServices ? (
              <Skeleton className="h-10" />
            ) : services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum serviço encontrado.
              </p>
            ) : (
              services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="service"
                    checked={selectedServiceId === service.id}
                    onChange={() => {
                      setSelectedServiceId(service.id);
                      setSelectedPackageId(null);
                    }}
                  />
                  {service.name}
                </label>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ou debitar de um pacote</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoadingPackages ? (
              <Skeleton className="h-10" />
            ) : packages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cliente sem pacotes ativos.
              </p>
            ) : (
              packages.map((pkg) => {
                const remaining = pkg.total_sessions - pkg.used_sessions;
                return (
                  <label
                    key={pkg.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="package"
                      checked={selectedPackageId === pkg.id}
                      onChange={() => {
                        setSelectedPackageId(pkg.id);
                        setSelectedServiceId(null);
                      }}
                    />
                    {pkg.name} · {remaining} sessões restantes
                  </label>
                );
              })
            )}
          </CardContent>
        </Card>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline" disabled={isSaving}>
            <Link href="/admin/dashboard">Cancelar</Link>
          </Button>
          <Button
            onClick={handleAssociate}
            disabled={isSaving || (!selectedServiceId && !selectedPackageId)}
          >
            {isSaving ? "Associando..." : "Associar"}
          </Button>
        </div>
      </div>
    </>
  );
}
