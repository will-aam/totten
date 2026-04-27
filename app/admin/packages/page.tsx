// app/admin/packages/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Users,
  AlertTriangle,
  CalendarClock,
  ArrowUp,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PackageDetailsModal } from "@/components/packages/package-details-modal";
import {
  getPackagesDashboardData,
  createManualPackageCheckIn,
} from "@/app/actions/packages";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // 🔥 Importado para o modal de confirmação

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  loading,
}: any) {
  return (
    <Card
      className={cn(
        "border-border shadow-sm flex flex-col justify-between active:scale-95 transition-transform duration-200",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
        ) : (
          <div className="text-3xl font-bold text-foreground tracking-tight">
            {value}
          </div>
        )}
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

// Componente de Bolinha Pulsante (Sonda)
function StatusIndicator({
  active,
  isEndingSoon,
}: {
  active: boolean;
  isEndingSoon: boolean;
}) {
  if (!active) {
    return (
      <span
        className="flex h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground opacity-50"
        title="Arquivado"
      />
    );
  }

  const baseColor = isEndingSoon ? "bg-orange-500" : "bg-emerald-500";

  return (
    <div className="relative flex h-2.5 w-2.5">
      <span
        className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          baseColor,
        )}
      ></span>
      <span
        className={cn(
          "relative inline-flex rounded-full h-2.5 w-2.5",
          baseColor,
        )}
      ></span>
    </div>
  );
}

function PackageListItem({ pkg, onOpenDetails, onManualCheckIn }: any) {
  const isEndingSoon = pkg.usedSessions >= pkg.totalSessions - 2;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 py-4 border-b border-border/50 last:border-0 active:bg-muted/50 transition-colors px-2 -mx-2 rounded-xl cursor-pointer hover:bg-muted/30",
        !pkg.active && "opacity-60",
      )}
    >
      <div
        className="flex items-center gap-3 min-w-0"
        onClick={() => onOpenDetails(pkg)}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold border",
            pkg.active
              ? "bg-primary/5 text-primary border-primary/10"
              : "bg-muted text-muted-foreground border-border",
          )}
        >
          {pkg.clientName.charAt(0)}
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-sm font-semibold truncate flex items-center gap-2",
              pkg.active
                ? "text-foreground"
                : "text-muted-foreground line-through decoration-muted-foreground/50",
            )}
          >
            {pkg.clientName}
            {!pkg.active && (
              <span className="text-[9px] uppercase tracking-wider bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm not-line-through">
                Arquivado
              </span>
            )}
          </span>
          <span className="text-[11px] text-muted-foreground truncate uppercase font-medium">
            {pkg.packageName}
          </span>
        </div>
      </div>

      <div
        className="flex flex-col items-end w-16 sm:w-24"
        onClick={() => onOpenDetails(pkg)}
      >
        <span className="text-[13px] font-bold text-foreground">
          {pkg.usedSessions} / {pkg.totalSessions}
        </span>
        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
          Sessões
        </span>
      </div>

      <div
        className="flex items-center justify-end w-8 sm:w-12 gap-2"
        onClick={() => onOpenDetails(pkg)}
      >
        <StatusIndicator active={pkg.active} isEndingSoon={isEndingSoon} />
      </div>

      <div className="flex items-center gap-1">
        {pkg.active ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 active:text-primary active:bg-primary/10 rounded-full shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onManualCheckIn(pkg);
            }}
            title="Registrar Check-in Manual"
          >
            <CheckCircle2 className="h-5 w-5" />
          </Button>
        ) : (
          <div className="h-10 w-10" />
        )}
      </div>
    </div>
  );
}

export default function PackagesPage() {
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // 🔥 NOVOS ESTADOS PARA O MODAL DE CHECK-IN
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [pkgToCheckIn, setPkgToCheckIn] = useState<any>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const [packages, setPackages] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    active: 0,
    endingSoon: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);

  // Estados de Paginação e Busca
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const searchQuery =
      debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : "";
    const result = await getPackagesDashboardData({
      page,
      limit: 20,
      search: searchQuery,
    });

    if (result.success) {
      setPackages(result.packages || []);
      setKpis(result.kpis || { active: 0, endingSoon: 0, totalPending: 0 });
      setTotalPages(result.totalPages || 1);
    }
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadData();
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadData]);

  const handleModalClose = (isOpen: boolean) => {
    setDetailsOpen(isOpen);
    if (!isOpen) {
      loadData();
    }
  };

  // 🔥 FUNÇÃO PARA ABRIR O DIALOG
  const openCheckInDialog = (pkg: any) => {
    if (pkg.usedSessions >= pkg.totalSessions) {
      toast.error("Saldo insuficiente.");
      return;
    }
    setPkgToCheckIn(pkg);
    setIsCheckInDialogOpen(true);
  };

  // 🔥 FUNÇÃO PARA EXECUTAR O CHECK-IN (Confirmar no Modal)
  const confirmManualCheckIn = async () => {
    if (!pkgToCheckIn) return;

    setIsCheckingIn(true);
    try {
      toast.loading("Registrando...", { id: "manual" });
      const res = await createManualPackageCheckIn(pkgToCheckIn.id);
      if (res.success) {
        toast.success("Check-in registrado com sucesso!", { id: "manual" });
        setIsCheckInDialogOpen(false); // Fecha o modal
        loadData(); // Atualiza a lista
      } else {
        toast.error(res.error || "Erro ao registrar.", { id: "manual" });
      }
    } catch (e) {
      toast.error("Erro na conexão.", { id: "manual" });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleOpenDetails = (pkg: any) => {
    setSelectedPackage(pkg);
    setDetailsOpen(true);
  };

  return (
    <>
      <AdminHeader title="Pacotes" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 md:grid md:grid-cols-3 scrollbar-hide">
          <KpiCard
            title="Pacotes Ativos"
            value={kpis.active}
            description="Em andamento"
            icon={Users}
            loading={loading}
            className="min-w-[85vw] md:min-w-0"
          />
          <KpiCard
            title="Próximos do Fim"
            value={kpis.endingSoon}
            description="Saldo crítico"
            icon={AlertTriangle}
            loading={loading}
            className="min-w-[85vw] md:min-w-0"
          />
          <KpiCard
            title="Total Pendente"
            value={kpis.totalPending}
            description="Sessões a realizar"
            icon={CalendarClock}
            loading={loading}
            className="min-w-[85vw] md:min-w-0"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente (mín. 3 letras)..."
              className="pl-9 h-12 bg-background rounded-2xl border-none shadow-sm focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => router.push("/admin/clients")}
            className="h-12 w-12 md:w-auto md:px-6 rounded-2xl font-bold shadow-md active:scale-90 transition-all"
          >
            <Plus className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Nova Venda</span>
          </Button>
        </div>

        <Card className="border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm rounded-4xl overflow-hidden">
          <CardHeader className="px-0 pt-0 md:pt-6 md:px-6">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <CalendarClock className="h-5 w-5 text-primary" /> Gestão de
              Consumo
            </CardTitle>
            <CardDescription>
              Clique no nome para o extrato ou no check para baixar uma sessão
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
            {loading ? (
              <div className="flex flex-col items-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Buscando pacotes...
                </span>
              </div>
            ) : packages.length > 0 ? (
              <div className="flex flex-col">
                {packages.map((pkg) => (
                  <PackageListItem
                    key={pkg.id}
                    pkg={pkg}
                    onOpenDetails={handleOpenDetails}
                    onManualCheckIn={openCheckInDialog} // 🔥 Alterado para abrir o dialog
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-muted rounded-4xl">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {search.length >= 3
                    ? "Nenhum pacote encontrado na busca"
                    : "Nenhum pacote encontrado"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 bg-card p-4 rounded-3xl border border-border/50 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center sm:text-left w-full sm:w-auto">
              Página {page} de {totalPages}
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="rounded-xl h-10 font-bold bg-background shadow-sm hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>

              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="rounded-xl h-10 font-bold bg-background shadow-sm hover:bg-muted"
              >
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <PackageDetailsModal
        open={detailsOpen}
        onOpenChange={handleModalClose}
        packageData={selectedPackage}
      />

      {/* 🔥 MODAL DE CONFIRMAÇÃO DE CHECK-IN */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Check-in Manual?</DialogTitle>
            <DialogDescription className="text-base py-2">
              Você está registrando uma sessão para{" "}
              <span className="font-bold text-foreground">
                {pkgToCheckIn?.clientName}
              </span>
              . Isso criará um registro na agenda e dará baixa no saldo do
              pacote.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCheckInDialogOpen(false)}
              disabled={isCheckingIn}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmManualCheckIn}
              disabled={isCheckingIn}
              className="w-full sm:w-auto"
            >
              {isCheckingIn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                  Registrando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-24 md:bottom-8 right-6 p-4 rounded-full bg-primary text-primary-foreground shadow-2xl active:scale-75 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100 hover:scale-105"
            : "translate-y-10 opacity-0 pointer-events-none",
        )}
      >
        <ArrowUp className="h-6 w-6" strokeWidth={3} />
      </button>
    </>
  );
}
