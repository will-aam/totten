// app/(private)/admin/master/_components/master-view.tsx
"use client";

import { useState, useMemo } from "react";
import {
  type MasterPlatformData,
  type MasterClinicItem,
  manuallyVerifyAdminEmail,
  resendClientActivationEmail,
  extendClientTrial,
} from "@/app/actions/master";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Mail,
  CheckCircle2,
  Clock,
  Phone,
  Search,
  ExternalLink,
  Calendar,
  Sparkles,
  MapPin,
  FileText,
  AlertCircle,
  MessageCircle,
  PlusCircle,
  Send,
  Loader2,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDocument, formatPhone } from "@/lib/utils";
import { OFFICIAL_PLANS, formatPlanName, formatSubscriptionStatus } from "@/lib/plans";

interface MasterViewProps {
  initialData: MasterPlatformData;
}

export function MasterView({ initialData }: MasterViewProps) {
  const [data, setData] = useState<MasterPlatformData>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VERIFIED" | "PENDING">("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [selectedClinic, setSelectedClinic] = useState<MasterClinicItem | null>(null);

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Filtros em tempo real
  const filteredClinics = useMemo(() => {
    return data.clinics.filter((clinic) => {
      // 1. Busca por texto
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        clinic.name.toLowerCase().includes(query) ||
        clinic.company_name.toLowerCase().includes(query) ||
        clinic.responsible_name.toLowerCase().includes(query) ||
        clinic.responsible_display_name.toLowerCase().includes(query) ||
        clinic.email_admin.toLowerCase().includes(query) ||
        clinic.document.toLowerCase().includes(query) ||
        clinic.phone_whatsapp.includes(query);

      // 2. Filtro de verificação de e-mail
      const isVerified = clinic.owner?.email_verified === true;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "VERIFIED" && isVerified) ||
        (statusFilter === "PENDING" && !isVerified);

      // 3. Filtro de plano
      const matchPlan = planFilter === "ALL" || clinic.plan === planFilter;

      return matchSearch && matchStatus && matchPlan;
    });
  }, [data.clinics, search, statusFilter, planFilter]);

  // Ação: Ativar e-mail manualmente
  const handleVerifyEmail = async (adminId: string, clinicId: string) => {
    setLoadingActionId(`verify-${adminId}`);
    try {
      const res = await manuallyVerifyAdminEmail(adminId);
      if (res.success) {
        toast.success(res.message);
        setData((prev) => ({
          ...prev,
          summary: {
            ...prev.summary,
            verifiedEmailsCount: prev.summary.verifiedEmailsCount + 1,
            pendingEmailsCount: Math.max(0, prev.summary.pendingEmailsCount - 1),
          },
          clinics: prev.clinics.map((c) =>
            c.id === clinicId && c.owner
              ? { ...c, owner: { ...c.owner, email_verified: true } }
              : c
          ),
        }));
        if (selectedClinic?.id === clinicId && selectedClinic.owner) {
          setSelectedClinic({
            ...selectedClinic,
            owner: { ...selectedClinic.owner, email_verified: true },
          });
        }
      } else {
        toast.error(res.error || "Erro ao ativar e-mail.");
      }
    } catch {
      toast.error("Erro inesperado ao ativar e-mail.");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Ação: Reenviar e-mail de ativação
  const handleResendEmail = async (adminId: string) => {
    setLoadingActionId(`resend-${adminId}`);
    try {
      const res = await resendClientActivationEmail(adminId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error || "Erro ao reenviar e-mail.");
      }
    } catch {
      toast.error("Erro ao reenviar e-mail.");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Ação: Prorrogar período de Trial (+7 dias)
  const handleExtendTrial = async (organizationId: string, days = 7) => {
    setLoadingActionId(`extend-${organizationId}`);
    try {
      const res = await extendClientTrial(organizationId, days);
      if (res.success) {
        toast.success(res.message);
        setData((prev) => ({
          ...prev,
          clinics: prev.clinics.map((c) => {
            if (c.id === organizationId) {
              const currentDays = c.trial_days_left ?? 0;
              return {
                ...c,
                trial_days_left: Math.max(0, currentDays) + days,
                subscription_status: "TRIAL",
              };
            }
            return c;
          }),
        }));
        if (selectedClinic?.id === organizationId) {
          setSelectedClinic((prev) =>
            prev
              ? {
                ...prev,
                trial_days_left: (prev.trial_days_left ?? 0) + days,
                subscription_status: "TRIAL",
              }
              : null
          );
        }
      } else {
        toast.error(res.error || "Erro ao prorrogar teste.");
      }
    } catch {
      toast.error("Erro ao prorrogar teste.");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Gera link do WhatsApp com mensagem amigável de suporte
  const getWhatsAppLink = (phone: string, businessName: string, responsibleName: string) => {
    const cleanDigits = phone.replace(/\D/g, "");
    if (!cleanDigits) return null;
    const number = cleanDigits.startsWith("55") ? cleanDigits : `55${cleanDigits}`;
    const text = encodeURIComponent(
      `Olá ${responsibleName}! Aqui é o suporte oficial do Totten. Notamos o cadastro de ${businessName} e estamos à disposição para ajudar com qualquer configuração inicial.`
    );
    return `https://wa.me/${number}?text=${text}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Navegação por Tabs Minimalistas */}
      <Tabs defaultValue="clients" className="w-full flex flex-col gap-6">
        <div className="border-b border-border/50">
          <TabsList className="flex w-full overflow-x-auto bg-transparent border-none rounded-none p-0 h-auto gap-6 justify-start">
            <TabsTrigger
              value="clients"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-1 pb-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Building2 className="h-4 w-4" />
              <span>Clientes</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {data.clinics.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-1 pb-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Relatório</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Clientes */}
        <TabsContent value="clients" className="mt-0 flex flex-col gap-6 focus-visible:outline-none">
          {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empresa, responsável, e-mail, CNPJ ou telefone..."
            className="pl-10 h-11 rounded-2xl bg-muted/40 border-border/60"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Filtro de E-mail */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-11 px-3 text-xs sm:text-sm rounded-2xl bg-muted/40 border border-border/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">E-mails: Todos</option>
            <option value="VERIFIED">Apenas Verificados</option>
            <option value="PENDING">Apenas Pendentes</option>
          </select>

          {/* Filtro de Plano (Apenas os 3 planos oficiais) */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-11 px-3 text-xs sm:text-sm rounded-2xl bg-muted/40 border border-border/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">Todos os Planos</option>
            <option value="BASIC">Plano Básico</option>
            <option value="MEDIUM">Plano Padrão</option>
            <option value="ADVANCED">Plano Avançado</option>
          </select>
        </div>
      </div>

      {/* 4. Listagem dos Clientes */}
      {filteredClinics.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-muted/10 flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Nenhuma empresa encontrada</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
            Nenhum estabelecimento ou cliente corresponde aos filtros ou à busca informada.
          </p>
          {(search || statusFilter !== "ALL" || planFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setPlanFilter("ALL");
              }}
              className="mt-2 rounded-xl"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredClinics.map((clinic) => {
            const isVerified = clinic.owner?.email_verified === true;
            const wppLink = getWhatsAppLink(clinic.phone_whatsapp, clinic.name, clinic.responsible_name);

            return (
              <div
                key={clinic.id}
                className="p-5 rounded-3xl border border-border/60 bg-card/70 hover:bg-card/90 transition-all shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                {/* Informações da Empresa & Responsável */}
                <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-lg">
                    {clinic.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-base text-foreground truncate">
                        {clinic.name}
                      </span>
                      {clinic.trade_name && clinic.trade_name !== clinic.name && (
                        <span className="text-xs text-muted-foreground truncate">
                          ({clinic.trade_name})
                        </span>
                      )}
                      {/* Status de Verificação de E-mail */}
                      <Badge
                        variant="outline"
                        className={
                          isVerified
                            ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[11px]"
                            : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[11px]"
                        }
                      >
                        {isVerified ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> E-mail Verificado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> E-mail Pendente
                          </span>
                        )}
                      </Badge>

                      {/* Nome Oficial do Plano (Básico, Padrão ou Avançado) */}
                      <Badge
                        variant="outline"
                        className={`${OFFICIAL_PLANS[clinic.plan]?.badgeClass || "border-border text-foreground bg-muted/40"} text-[11px] font-medium`}
                      >
                        {OFFICIAL_PLANS[clinic.plan]?.name || "Plano Avançado"}
                      </Badge>

                      {/* Status da Assinatura (Ativa, Em Teste, etc.) */}
                      <Badge
                        variant="outline"
                        className={`${formatSubscriptionStatus(clinic.subscription_status, clinic.trial_days_left).badgeClass} text-[11px] font-medium`}
                      >
                        {formatSubscriptionStatus(clinic.subscription_status, clinic.trial_days_left).label}
                      </Badge>
                    </div>

                    {/* Detalhes do Responsável */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-foreground font-medium">{clinic.responsible_name}</span>
                        {clinic.responsible_display_name && (
                          <span className="text-muted-foreground">
                            (chama de "{clinic.responsible_display_name}")
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{clinic.email_admin}</span>
                      </div>

                      {clinic.phone_whatsapp && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{formatPhone(clinic.phone_whatsapp)}</span>
                        </div>
                      )}

                      {clinic.document && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{formatDocument(clinic.document)}</span>
                        </div>
                      )}
                    </div>

                    {/* Métricas da Equipe e Trial */}
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="bg-muted/50 px-2 py-0.5 rounded-md font-medium text-foreground">
                        👥 {clinic.professionals_count} {clinic.professionals_count === 1 ? "profissional" : "profissionais"} na equipe
                      </span>

                      {clinic.trial_days_left !== null && (
                        <span className={clinic.trial_days_left > 0 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-destructive font-medium"}>
                          ⏱️ {clinic.trial_days_left > 0 ? `${clinic.trial_days_left} dias de teste restantes` : "Período de teste expirado"}
                        </span>
                      )}

                      <span>
                        Cadastrado em {new Date(clinic.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                  {/* WhatsApp Direto */}
                  {wppLink && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs"
                    >
                      <a href={wppLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        WhatsApp
                      </a>
                    </Button>
                  )}

                  {/* Se e-mail pendente: Botão Ativar Manualmente */}
                  {!isVerified && clinic.owner && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={loadingActionId === `verify-${clinic.owner.id}`}
                        onClick={() => handleVerifyEmail(clinic.owner!.id, clinic.id)}
                        className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        {loadingActionId === `verify-${clinic.owner.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        Ativar E-mail
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingActionId === `resend-${clinic.owner.id}`}
                        onClick={() => handleResendEmail(clinic.owner!.id)}
                        className="h-9 rounded-xl text-xs"
                      >
                        {loadingActionId === `resend-${clinic.owner.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Send className="h-3.5 w-3.5 mr-1" />
                        )}
                        Reenviar Link
                      </Button>
                    </>
                  )}

                  {/* Prorrogar Trial (+7 dias) */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingActionId === `extend-${clinic.id}`}
                    onClick={() => handleExtendTrial(clinic.id, 7)}
                    className="h-9 rounded-xl text-xs hover:bg-amber-500/10 hover:border-amber-500/30"
                  >
                    {loadingActionId === `extend-${clinic.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <PlusCircle className="h-3.5 w-3.5 mr-1 text-amber-500" />
                    )}
                    +7 Dias Trial
                  </Button>

                  {/* Ver Detalhes */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedClinic(clinic)}
                    className="h-9 rounded-xl text-xs"
                  >
                    Detalhes
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </TabsContent>

        {/* Tab 2: Relatório (Vazia) */}
        <TabsContent value="reports" className="mt-0 focus-visible:outline-none" />
      </Tabs>

      {/* 5. Modal de Detalhes da Empresa Selecionada */}
      {selectedClinic && (
        <Dialog open={!!selectedClinic} onOpenChange={(open) => !open && setSelectedClinic(null)}>
          <DialogContent className="max-w-xl rounded-3xl p-6 sm:p-7">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                  {selectedClinic.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">{selectedClinic.name}</DialogTitle>
                  <DialogDescription className="text-xs">
                    Identificador: <span className="font-mono text-muted-foreground">{selectedClinic.id}</span>
                  </DialogDescription>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={`${OFFICIAL_PLANS[selectedClinic.plan]?.badgeClass || "border-border text-foreground bg-muted/40"} text-[11px] font-medium`}
                    >
                      {OFFICIAL_PLANS[selectedClinic.plan]?.name || "Plano Avançado"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`${formatSubscriptionStatus(selectedClinic.subscription_status, selectedClinic.trial_days_left).badgeClass} text-[11px] font-medium`}
                    >
                      {formatSubscriptionStatus(selectedClinic.subscription_status, selectedClinic.trial_days_left).label}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-4 mt-2 text-sm">
              {/* Bloco 1: Dados do Responsável */}
              <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Dados do Responsável
                </span>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Nome: </span>
                    <span className="font-medium text-foreground">{selectedClinic.responsible_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Como gosta de ser chamado: </span>
                    <span className="font-medium text-foreground">
                      {selectedClinic.responsible_display_name || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">E-mail: </span>
                    <span className="font-medium text-foreground">{selectedClinic.email_admin}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status do E-mail: </span>
                    <span className="font-medium">
                      {selectedClinic.owner?.email_verified ? (
                        <span className="text-emerald-500 font-semibold">✓ Verificado</span>
                      ) : (
                        <span className="text-amber-500 font-semibold">Pendente</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Contatos e Endereço */}
              <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Contato e Localização
                </span>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">WhatsApp: </span>
                    <span className="font-medium text-foreground">
                      {selectedClinic.phone_whatsapp ? formatPhone(selectedClinic.phone_whatsapp) : "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefone Fixo: </span>
                    <span className="font-medium text-foreground">
                      {selectedClinic.phone_landline ? formatPhone(selectedClinic.phone_landline) : "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Documento: </span>
                    <span className="font-medium text-foreground">
                      {selectedClinic.document ? formatDocument(selectedClinic.document) : "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Endereço: </span>
                    <span className="font-medium text-foreground">
                      {selectedClinic.address || "Não informado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloco 3: Métricas de Uso do Negócio */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl border border-border/60 bg-muted/20 text-center">
                  <span className="text-[11px] text-muted-foreground block">Profissionais</span>
                  <span className="text-lg font-bold text-foreground">{selectedClinic.professionals_count}</span>
                </div>
                <div className="p-3 rounded-2xl border border-border/60 bg-muted/20 text-center">
                  <span className="text-[11px] text-muted-foreground block">Agendamentos</span>
                  <span className="text-lg font-bold text-foreground">{selectedClinic.appointments_count}</span>
                </div>
                <div className="p-3 rounded-2xl border border-border/60 bg-muted/20 text-center">
                  <span className="text-[11px] text-muted-foreground block">Clientes Cadastrados</span>
                  <span className="text-lg font-bold text-foreground">{selectedClinic.clients_count}</span>
                </div>
              </div>

              {/* Link para página pública */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Link href={`/${selectedClinic.slug}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir Página Pública
                  </Link>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedClinic(null)}
                  className="rounded-xl text-xs"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

