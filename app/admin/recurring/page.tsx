// app/admin/recurring/page.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { AdminHeader } from "@/components/admin-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Repeat,
  CalendarRange,
  Clock,
  AlertTriangle,
  Trash2,
  MessageCircle,
  Package as PackageIcon,
  Search,
  ArrowUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteAppointment } from "@/app/actions/appointments";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RecurringSeries {
  recurrenceId: string;
  client: { id: string; name: string; phone_whatsapp: string };
  serviceName: string;
  package: {
    id: string;
    name: string;
    total_sessions: number;
    used_sessions: number;
  } | null;
  startDate: string;
  endDate: string;
  pattern: string;
  totalSessions: number;
  completedSessions: number;
  remainingInSeries: number;
  packageBalance: number | null;
  nextSession: string | null;
  warnings: string[];
  status: "ATIVA" | "FINALIZADA";
}

export default function RecurringAppointmentsPage() {
  const { data, isLoading, mutate } = useSWR<{ series: RecurringSeries[] }>(
    "/api/admin/recurring",
    fetcher,
    { refreshInterval: 0 },
  );

  // 🔥 Estados para o Filtro e Seta para Cima
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Lógica da Seta para Cima
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteSeries = async (recurrenceId: string) => {
    try {
      const res = await deleteAppointment("", true, recurrenceId);
      if (res.success) {
        toast.success("Série cancelada e horários liberados!");
        mutate();
      } else {
        toast.error("Erro ao cancelar a série.");
      }
    } catch (error) {
      toast.error("Erro de conexão ao cancelar.");
    }
  };

  const handleWhatsApp = (
    phone: string,
    clientName: string,
    warnings: string[],
  ) => {
    const cleanPhone = phone.replace(/\D/g, "");
    let msg = `Olá ${clientName.split(" ")[0]}! Tudo bem?`;

    if (warnings.length > 0) {
      msg += ` Passando para lembrar que o seu pacote está finalizando, mas ainda temos seus horários fixos reservados na nossa agenda. Gostaria de renovar o plano para mantermos as suas vagas?`;
    }

    window.open(
      `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  // 🔥 Lógica do Filtro Inteligente
  const filteredSeries =
    data?.series?.filter((series) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        series.client.name.toLowerCase().includes(searchLower) ||
        series.serviceName.toLowerCase().includes(searchLower)
      );
    }) || [];

  return (
    <>
      <AdminHeader title="Gestão de Recorrências" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
        {/* Cabeçalho da Página e Filtro */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold tracking-tight">
              Cadeiras Ocupadas
            </h2>
            <p className="text-sm text-muted-foreground">
              Acompanhe os horários fixos dos clientes e identifique pacotes que
              precisam de renovação.
            </p>
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Buscar cliente ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl bg-background border-border/50 focus-visible:ring-primary/30"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60">
            <Repeat className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              Nenhuma série encontrada
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              {searchTerm
                ? "Tente buscar por outro nome ou serviço."
                : 'Crie um agendamento marcando a opção "Agendamento Recorrente" para gerenciar seus horários fixos aqui.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredSeries.map((series) => {
              const hasWarning = series.warnings.length > 0;
              const isFinished = series.status === "FINALIZADA";
              const progress =
                (series.completedSessions / series.totalSessions) * 100;

              return (
                <Card
                  key={series.recurrenceId}
                  className={`flex flex-col rounded-2xl border transition-all ${
                    hasWarning
                      ? "border-destructive/50 shadow-sm bg-destructive/5"
                      : "bg-card hover:border-primary/20"
                  } ${isFinished ? "opacity-60 grayscale-[0.5]" : ""}`}
                >
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col truncate pr-2">
                        <CardTitle
                          className="text-lg font-bold truncate"
                          title={series.client.name}
                        >
                          {series.client.name}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground font-medium truncate mt-0.5">
                          {series.serviceName}
                        </span>
                      </div>
                      <Badge
                        variant={isFinished ? "secondary" : "default"}
                        className="shrink-0"
                      >
                        {isFinished ? "Finalizada" : "Ativa"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-4 py-4 flex-1">
                    {/* O Padrão */}
                    <div className="flex flex-col gap-1.5 bg-muted/40 p-3 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        {series.pattern}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarRange className="h-3.5 w-3.5" />
                        De{" "}
                        {new Date(series.startDate).toLocaleDateString(
                          "pt-BR",
                        )}{" "}
                        até{" "}
                        {new Date(series.endDate).toLocaleDateString("pt-BR")}
                      </div>
                    </div>

                    {/* Progresso da Série */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold uppercase text-muted-foreground">
                          Sessões da Série
                        </span>
                        <span className="text-sm font-bold">
                          {series.completedSessions} / {series.totalSessions}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Vínculo com Pacote e Alertas */}
                    {series.package && (
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <PackageIcon className="h-3.5 w-3.5" /> Pacote
                            Vinculado
                          </span>
                          <span>Saldo: {series.packageBalance}</span>
                        </div>

                        {hasWarning && (
                          <div className="flex gap-2 bg-destructive/10 text-destructive p-3 rounded-xl border border-destructive/20 animate-in fade-in zoom-in-95">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold leading-relaxed">
                              {series.warnings[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0 pb-4 px-4 flex gap-2 border-t border-border/50 mt-auto">
                    <Button
                      variant="outline"
                      className={`flex-1 rounded-xl transition-colors shadow-sm ${
                        hasWarning
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent"
                          : "bg-white hover:bg-[#25D366]/10 hover:text-[#128C7E] hover:border-[#25D366]/40"
                      }`}
                      onClick={() =>
                        handleWhatsApp(
                          series.client.phone_whatsapp,
                          series.client.name,
                          series.warnings,
                        )
                      }
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {hasWarning ? "Cobrar Renovação" : "WhatsApp"}
                    </Button>

                    {!isFinished && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Liberar Horários (Excluir Série)"
                            className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Liberar Cadeiras Ocupadas?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Isto irá{" "}
                              <b>apagar da agenda todas as sessões futuras</b>{" "}
                              da cliente {series.client.name} que ainda não
                              foram realizadas.
                              <br />
                              <br />
                              Os horários ficarão livres para novas marcações.
                              Tem certeza?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">
                              Voltar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteSeries(series.recurrenceId)
                              }
                              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl"
                            >
                              Sim, liberar horários
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 🔥 BOTÃO VOLTAR AO TOPO */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none",
        )}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </>
  );
}
