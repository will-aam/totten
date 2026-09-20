// app/(private)/admin/clients/_components/client-package.tsx
"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Package, Plus, LoaderDots, Archive, Calendar as CalendarIcon, CalendarDetail } from "@boxicons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

//  CORREÇÃO: Importando exatamente o nome exportado na Action
import { archivePackage, createPackageAction } from "@/app/actions/packages";
import { apiClient } from "@/lib/api-client";
import { NewPackageSaleModal } from "../../_components/new-package-sale-modal";

export type PackageType = {
  id: string;
  name: string;
  total_sessions: number;
  used_sessions: number;
  price: number | string;
  active: boolean;
  sessionDates?: string[];
  created_at?: string;
  expiresAt?: string;
  isExpired?: boolean;
};

interface ClientPackageProps {
  clientId: string;
  clientActive: boolean;
}

export function ClientPackage({ clientId, clientActive }: ClientPackageProps) {
  const packageCacheKey = `admin/clients/${clientId}/packages`;
  const { data: packages, isLoading: isLoadingPackages } = useSWR<
    PackageType[]
  >(packageCacheKey, apiClient);

  const activePackages = packages?.filter((pkg) => pkg.active) || [];

  const [addPkgOpen, setAddPkgOpen] = useState(false);

  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [pkgToArchive, setPkgToArchive] = useState<PackageType | null>(null);

  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

  // Estados para o Dialog de Prorrogação (VISUAL)
  const [isProrrogarDialogOpen, setIsProrrogarDialogOpen] = useState(false);
  const [pkgToProrrogar, setPkgToProrrogar] = useState<PackageType | null>(null);
  const [newExpirationDate, setNewExpirationDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);


  const handleArchivePackage = async () => {
    if (!pkgToArchive) return;
    setIsArchiving(true);
    try {
      const result = await archivePackage(pkgToArchive.id);
      if (result.success) {
        toast.success("Pacote encerrado com sucesso!");
        mutate(packageCacheKey);
        setIsArchiveDialogOpen(false);
        setPkgToArchive(null);
      } else {
        toast.error(result.error || "Falha ao encerrar Pacote.");
      }
    } catch (error) {
      toast.error("Erro de comunicação com o servidor.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleProrrogar = () => {
    if (!newExpirationDate) {
      toast.error("Selecione uma data limite");
      return;
    }
    toast.success(`O pacote foi estendido até ${format(newExpirationDate, "dd/MM/yyyy")}.`);
    setIsProrrogarDialogOpen(false);
    setPkgToProrrogar(null);
    setNewExpirationDate(undefined);
  };

  const renderPackageInfo = (pkg: PackageType) => {
    const progress = Math.round((pkg.used_sessions / pkg.total_sessions) * 100);
    return (
      <div className="flex flex-col gap-4 md:bg-transparent">
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-sm truncate uppercase tracking-wider">
            {pkg.name}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            Início do ciclo:{" "}
            {pkg.created_at
              ? new Date(pkg.created_at).toLocaleDateString("pt-BR")
              : "--/--/----"}
          </span>
          {pkg.expiresAt && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
                  pkg.isExpired
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {pkg.isExpired
                  ? "Vencido"
                  : `Válido até ${new Date(pkg.expiresAt).toLocaleDateString("pt-BR")}`}
              </span>
              {pkg.active && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[9px] px-2 font-bold uppercase tracking-wider border-primary/20 text-primary hover:bg-primary/10"
                  onClick={() => {
                    setPkgToProrrogar(pkg);
                    setIsProrrogarDialogOpen(true);
                  }}
                >
                  Prorrogar
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            Sessões Realizadas
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-primary leading-none">
              {pkg.used_sessions}
            </span>
            <span className="text-lg font-medium text-muted-foreground leading-none">
              / {pkg.total_sessions}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Progress
            value={progress}
            className="h-2.5 bg-primary/10 [&>div]:bg-primary"
          />
          <p className="text-xs font-medium text-muted-foreground">
            Restam {pkg.total_sessions - pkg.used_sessions} sessões para
            concluir.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <Button
            variant="destructive"
            className="w-full h-10 flex items-center justify-center"
            onClick={() => {
              setPkgToArchive(pkg);
              setIsArchiveDialogOpen(true);
            }}
          >
            <Archive className="h-4 w-4 mr-2" /> Encerrar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="md:col-span-1 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <Package className="h-5 w-5 text-primary" /> Pacote Ativo
        </CardTitle>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddPkgOpen(true)}
          disabled={!clientActive || activePackages.length >= 1}
          title={
            activePackages.length >= 1
              ? "Encerre o Pacote atual para vender outro"
              : ""
          }
          className="h-8 border-primary/20 text-primary select-none transition-transform duration-100 ease-out hover:bg-transparent hover:text-primary active:scale-95 active:bg-primary/10 text-xs font-medium px-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={2} />
          {activePackages.length >= 1 ? "Limite Atingido" : "Nova venda"}
        </Button>
      </CardHeader>

      <div className="w-[90%] mx-auto border-t border-border/50 mb-4" />

      <CardContent className="px-0 pb-4 md:pb-6 md:px-6 flex flex-col">
        {isLoadingPackages ? (
          <div className="space-y-4 px-4 md:px-0">
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ) : activePackages.length > 0 ? (
          <div className="relative">
            {activePackages.length === 1 ? (
              <div className="px-4 md:px-0">
                {renderPackageInfo(activePackages[0])}
              </div>
            ) : (
              <div className="flex flex-col">
                <Carousel
                  setApi={setApi}
                  opts={{ align: "start", loop: false }}
                  className="w-full"
                >
                  <CarouselContent>
                    {activePackages.map((pkg) => (
                      <CarouselItem key={pkg.id}>
                        <div className="px-4 md:px-1">
                          {renderPackageInfo(pkg)}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                <div className="flex justify-center gap-2 mt-5">
                  {activePackages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => api?.scrollTo(i)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-500 ease-in-out",
                        current === i
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/30 w-2 hover:bg-primary/50",
                      )}
                      aria-label={`Ir para o Pacote ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center bg-muted/20 rounded-full border border-dashed border-border p-6 py-10 md:border-dashed md:bg-transparent mx-4 md:mx-0">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Package
                className="h-6 w-6 text-muted-foreground/50"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Sem Pacote ativo
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-50">
              Clique em "Novo" para vender um pacote.
            </p>
          </div>
        )}
      </CardContent>

      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent className="sm:max-w-100 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Encerrar Pacote Prematuramente?
            </DialogTitle>
            <DialogDescription className="text-base py-2">
              Tem certeza que deseja encerrar o Pacote{" "}
              <strong>{pkgToArchive?.name}</strong>? O saldo restante de sessões
              será perdido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsArchiveDialogOpen(false)}
              disabled={isArchiving}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleArchivePackage}
              disabled={isArchiving}
              className="w-full sm:w-auto"
            >
              {isArchiving ? (
                <LoaderDots className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Sim, encerrar Pacote"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewPackageSaleModal
        open={addPkgOpen}
        onOpenChange={setAddPkgOpen}
        clientId={clientId}
        onCreated={() => mutate(packageCacheKey)}
      />

      {/* Dialog de Prorrogação (VISUAL) */}
      <Dialog open={isProrrogarDialogOpen} onOpenChange={setIsProrrogarDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-4xl">
          <DialogHeader>
            <DialogTitle>Prorrogar Validade</DialogTitle>
            <DialogDescription>
              Selecione a nova data limite para o uso deste pacote. Essa ação ficará registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Nova Data Limite
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-medium bg-card border-border/50 h-12 rounded-2xl shadow-sm hover:bg-muted/50 transition-colors",
                    !newExpirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDetail className="mr-2 h-4 w-4 text-primary" />
                  {newExpirationDate ? format(newExpirationDate, "dd/MM/yy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-3xl border-none shadow-2xl"
                align="start"
              >
                <CalendarUI
                  mode="single"
                  selected={newExpirationDate}
                  onSelect={setNewExpirationDate}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProrrogarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleProrrogar}>
              Salvar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
