"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateAppointment } from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck2,
  Clock,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Lock,
  ChevronRight,
  TrendingUp,
  CreditCard,
  User,
  Settings,
  ShieldCheck,
} from "lucide-react";

interface AutoDashboardClientProps {
  initialData: {
    metrics: {
      totalSelfService: number;
      pendingRequests: number;
      approvedSelfService: number;
      conversionRate: number;
      totalPixDepositsMonth: number;
    };
    settings: {
      isMercadoPagoActive: boolean;
      requirePrepayment: boolean;
      pixKey: string;
    };
    recentPending: any[];
  };
}

export function AutoDashboardClient({ initialData }: AutoDashboardClientProps) {
  const router = useRouter();
  const { metrics, settings, recentPending } = initialData;
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id);
    try {
      const res = await updateAppointment(id, {
        status: newStatus,
        paymentMethod: null,
        observations: "",
        hasCharge: false,
      });

      if (res.success) {
        toast.success(`Solicitação ${newStatus === "aprovado" ? "aprovada" : "recusada"} com sucesso.`);
        router.refresh();
      } else {
        toast.error(res.error || "Erro ao processar solicitação.");
      }
    } catch {
      toast.error("Ocorreu um erro ao processar a solicitação.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header com Boas-Vindas e Status Geral */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Autoatendimento
            <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 border-primary/30 text-primary">
              Online
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas de conversão, depósitos via Pix e solicitações da sua página pública.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5 h-9 rounded-xl font-medium">
            <Link href="/admin/custom-page">
              <Settings className="w-4 h-4 text-muted-foreground" />
              Configurar Página
            </Link>
          </Button>
          <Button size="sm" asChild className="gap-1.5 h-9 rounded-xl font-medium">
            <Link href="/admin/auto/requests">
              Ver Solicitações
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Grid de Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Autoagendamentos */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Agendamentos Totais</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">{metrics.totalSelfService}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gerados pelo link público</span>
            </p>
          </div>
        </div>

        {/* Card 2: Solicitações Pendentes */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Pendentes de Aprovação</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">{metrics.pendingRequests}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.pendingRequests === 0 ? "Nenhuma solicitação na fila" : "Aguardando sua confirmação"}
            </p>
          </div>
        </div>

        {/* Card 3: Taxa de Conversão */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Taxa de Conversão</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">{metrics.conversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.approvedSelfService} agendamentos confirmados
            </p>
          </div>
        </div>

        {/* Card 4: Sinais Pix do Mês */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Sinais Pix (Mês)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#009EE3] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-foreground">
              R$ {metrics.totalPixDepositsMonth.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className={settings.isMercadoPagoActive ? "text-[#009EE3] font-semibold" : ""}>
                {settings.isMercadoPagoActive ? "Mercado Pago Automático" : "Chave Pix Manual"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Seção Central: Solicitações Recentes + Banner de Upsell */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Solicitações Pendentes Rápidas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Solicitações Recentes</h2>
              <p className="text-xs text-muted-foreground">Últimos pedidos que precisam da sua aprovação</p>
            </div>
            {recentPending.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1 font-semibold text-primary">
                <Link href="/admin/auto/requests">
                  Ver todas ({metrics.pendingRequests})
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            )}
          </div>

          {recentPending.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">Sem solicitações pendentes</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Todos os agendamentos já foram revisados ou estão confirmados automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPending.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/80 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{req.client?.name}</p>
                        {req.mp_payment_id ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#009EE3]/40 text-[#009EE3] font-bold">
                            Pix Pago
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400">
                            Aprovação Manual
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.snapshot_service_name || req.service?.name} &bull;{" "}
                        {format(new Date(req.date_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        {req.professional?.name ? ` com ${req.professional.name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={loadingId === req.id}
                      onClick={() => handleStatusChange(req.id, "cancelado")}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Recusar
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-2.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={loadingId === req.id}
                      onClick={() => handleStatusChange(req.id, "aprovado")}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Aprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna 3: Showcase / Upsell de Automação de WhatsApp */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            Automações WhatsApp
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-none text-[10px] font-bold">
              PRO
            </Badge>
          </h2>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/20 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground">Disparo Automático de Lembretes</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Envie confirmações instantâneas e lembretes 2 horas antes de cada consulta pelo WhatsApp da sua clínica sem precisar clicar em nada.
              </p>
            </div>

            <div className="space-y-2 pt-1 border-t border-border/40 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Confirmação com 1 clique do cliente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero faltas com lembrete inteligente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Envio automático de comprovante</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full text-xs font-bold h-9 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={() => {
                  toast.info("O módulo de WhatsApp Automático estará disponível em breve no plano Pro!");
                }}
              >
                <Lock className="w-3.5 h-3.5" />
                Desbloquear no Plano Pro
              </Button>
            </div>
          </div>

          {/* Card Didático: Política de Sinal & Cancelamento (Arras) */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Política de Sinal & Cancelamentos</h3>
                <span className="text-[10px] text-muted-foreground font-medium">Legislação de Arras (Código Civil, Art. 418)</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              O sinal pago pelo cliente reserva a vaga na sua agenda. Em caso de desistência ou não comparecimento (no-show), o valor fica retido pelo salão como indenização pelo tempo reservado.
            </p>

            <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50 text-[11px] text-muted-foreground space-y-1.5">
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-foreground shrink-0">• Sem Estorno Automático:</span>
                <span>O sistema protege o seu caixa e nunca faz saques ou devoluções na sua conta.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-foreground shrink-0">• Exceções do Salão:</span>
                <span>Se o salão precisar cancelar por imprevisto próprio, a devolução é combinada e feita manualmente via Pix bancário direto.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
