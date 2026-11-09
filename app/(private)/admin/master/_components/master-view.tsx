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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Search,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { formatPhone } from "@/lib/utils";
import { OFFICIAL_PLANS, formatSubscriptionStatus } from "@/lib/plans";
import { ClientProfileView } from "./client-profile-view";
import { MasterFinancialReports } from "./master-financial-reports";

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

      // 3. Filtro de plano (Apenas Básico, Padrão ou Avançado)
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
          {selectedClinic ? (
            /* Vista 2: Perfil Dedicado do Cliente Selecionado */
            <ClientProfileView
              clinic={selectedClinic}
              onBack={() => setSelectedClinic(null)}
              onUpdateClinic={(updated) => {
                setSelectedClinic(updated);
                setData((prev) => ({
                  ...prev,
                  clinics: prev.clinics.map((c) => (c.id === updated.id ? updated : c)),
                }));
              }}
              onVerifyEmail={handleVerifyEmail}
              onResendEmail={handleResendEmail}
              onExtendTrial={handleExtendTrial}
              loadingActionId={loadingActionId}
            />
          ) : (
            /* Vista 1: Tabela Simples de Texto e Filtros */
            <>
              {/* Filtros e Busca */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por empresa, e-mail ou telefone..."
                    className="pl-10 h-11 rounded-2xl bg-muted/30 border-border/60 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {/* Filtro de E-mail */}
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val as any)}
                  >
                    <SelectTrigger className="h-11 min-w-[155px] rounded-2xl bg-muted/30 border-border/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Status do E-mail" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">E-mails: Todos</SelectItem>
                      <SelectItem value="VERIFIED">Apenas Verificados</SelectItem>
                      <SelectItem value="PENDING">Apenas Pendentes</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro de Plano (Apenas os 3 planos oficiais) */}
                  <Select
                    value={planFilter}
                    onValueChange={(val) => setPlanFilter(val)}
                  >
                    <SelectTrigger className="h-11 min-w-[155px] rounded-2xl bg-muted/30 border-border/60 text-xs sm:text-sm">
                      <SelectValue placeholder="Filtrar Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos os Planos</SelectItem>
                      <SelectItem value="BASIC">Plano Básico</SelectItem>
                      <SelectItem value="MEDIUM">Plano Padrão</SelectItem>
                      <SelectItem value="ADVANCED">Plano Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabela Limpa e Minimalista */}
              <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-xs">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60 bg-muted/30">
                      <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 pl-5">
                        Empresa
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5">
                        WhatsApp
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5">
                        Plano
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5">
                        Assinatura
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5">
                        E-mail
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 text-center">
                        Ação
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClinics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                          Nenhuma empresa encontrada com os filtros informados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClinics.map((clinic) => {
                        const isVerified = clinic.owner?.email_verified === true;
                        const statusInfo = formatSubscriptionStatus(
                          clinic.subscription_status,
                          clinic.trial_days_left,
                          clinic.current_period_end
                        );

                        return (
                          <TableRow
                            key={clinic.id}
                            onClick={() => setSelectedClinic(clinic)}
                            className="hover:bg-muted/30 border-border/40 transition-colors cursor-pointer group"
                          >
                            {/* Empresa (apenas o nome, sem documento exposto) */}
                            <TableCell className="py-4 pl-5 font-medium text-sm text-foreground">
                              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {clinic.name}
                              </span>
                            </TableCell>

                            {/* WhatsApp (Sem font-mono) */}
                            <TableCell className="py-4 text-sm text-foreground/80">
                              {clinic.phone_whatsapp ? formatPhone(clinic.phone_whatsapp) : "—"}
                            </TableCell>

                            {/* Plano (Básico, Padrão ou Avançado) */}
                            <TableCell className="py-4 text-sm">
                              <Badge
                                variant="outline"
                                className={`${OFFICIAL_PLANS[clinic.plan]?.badgeClass || "border-border text-foreground bg-muted/40"} text-xs px-2.5 py-0.5 font-medium`}
                              >
                                {OFFICIAL_PLANS[clinic.plan]?.name || "Plano Avançado"}
                              </Badge>
                            </TableCell>

                            {/* Assinatura */}
                            <TableCell className="py-4 text-sm">
                              <Badge
                                variant="outline"
                                className={`${statusInfo.badgeClass} text-xs px-2.5 py-0.5 font-medium`}
                              >
                                {statusInfo.label}
                              </Badge>
                            </TableCell>

                            {/* E-mail */}
                            <TableCell className="py-4 text-sm">
                              <span
                                className={
                                  isVerified
                                    ? "text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1.5 text-xs"
                                    : "text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1.5 text-xs"
                                }
                              >
                                {isVerified ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5" />
                                )}
                                {isVerified ? "Verificado" : "Pendente"}
                              </span>
                            </TableCell>

                            {/* Ação (Centralizada) */}
                            <TableCell className="py-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClinic(clinic);
                                }}
                                className="h-8 px-3 text-xs text-foreground hover:text-primary hover:border-primary/50 font-medium rounded-xl transition-colors cursor-pointer"
                              >
                                Gerenciar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 2: Relatório Financeiro e Estratégico */}
        <TabsContent value="reports" className="mt-0 flex flex-col gap-6 focus-visible:outline-none">
          <MasterFinancialReports clinics={data.clinics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
