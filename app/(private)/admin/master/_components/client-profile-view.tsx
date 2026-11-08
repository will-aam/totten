// app/(private)/admin/master/_components/client-profile-view.tsx
"use client";

import { useState } from "react";
import {
  type MasterClinicItem,
  updateClientPassword,
  updateClientDetails,
} from "@/app/actions/master";
import { OFFICIAL_PLANS, formatSubscriptionStatus, type OfficialPlan } from "@/lib/plans";
import { formatDocument, formatPhone } from "@/lib/utils";
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
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  KeyRound,
  ExternalLink,
  Save,
  Send,
  Loader2,
  ShieldCheck,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Edit3,
} from "lucide-react";
import { Whatsapp } from "@boxicons/react";
import { toast } from "sonner";
import Link from "next/link";

interface ClientProfileViewProps {
  clinic: MasterClinicItem;
  onBack: () => void;
  onUpdateClinic: (updated: MasterClinicItem) => void;
  onVerifyEmail: (adminId: string, clinicId: string) => Promise<void>;
  onResendEmail: (adminId: string) => Promise<void>;
  onExtendTrial: (organizationId: string) => Promise<void>;
  loadingActionId: string | null;
}

export function ClientProfileView({
  clinic,
  onBack,
  onUpdateClinic,
  onVerifyEmail,
  onResendEmail,
  onExtendTrial,
  loadingActionId,
}: ClientProfileViewProps) {
  // Controle de colapso do formulário de edição cadastral
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // Formatar data para o input date (YYYY-MM-DD)
  const initialDateStr = clinic.current_period_end
    ? new Date(clinic.current_period_end).toISOString().split("T")[0]
    : "";

  // Estado para formulário de edição cadastral
  const [formData, setFormData] = useState({
    name: clinic.name || "",
    trade_name: clinic.trade_name || "",
    document: clinic.document || "",
    responsible_name: clinic.responsible_name || "",
    responsible_display_name: clinic.responsible_display_name || "",
    email_admin: clinic.email_admin || "",
    phone_whatsapp: clinic.phone_whatsapp || "",
    phone_landline: clinic.phone_landline || "",
    address: clinic.address || "",
    plan: clinic.plan || "BASIC",
    subscription_status: clinic.subscription_status || "ACTIVE",
    current_period_end: initialDateStr,
  });

  const [savingDetails, setSavingDetails] = useState(false);

  // Estado para redefinição de senha
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Link do WhatsApp oficial
  const getWhatsAppLink = (number: string, businessName: string, responsibleName: string) => {
    if (!number) return null;
    const clean = number.replace(/\D/g, "");
    if (!clean) return null;
    const phoneWithCountry = clean.startsWith("55") ? clean : `55${clean}`;
    const text = encodeURIComponent(
      `Olá ${responsibleName || "parceiro"}! Aqui é o suporte oficial do Totten sobre a conta de ${businessName}. Estamos à disposição para ajudar.`
    );
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  };

  const wppLink = getWhatsAppLink(formData.phone_whatsapp, formData.name, formData.responsible_name);
  const isEmailVerified = clinic.owner?.email_verified === true;
  const statusInfo = formatSubscriptionStatus(
    clinic.subscription_status,
    clinic.trial_days_left,
    clinic.current_period_end
  );

  // Salvar alterações cadastrais
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("O nome da empresa é obrigatório.");
      return;
    }

    setSavingDetails(true);
    try {
      const res = await updateClientDetails(clinic.id, {
        ...formData,
        current_period_end: formData.current_period_end
          ? new Date(`${formData.current_period_end}T23:59:59.000Z`).toISOString()
          : null,
      });

      if (res.success) {
        toast.success(res.message);
        onUpdateClinic({
          ...clinic,
          name: formData.name.trim(),
          trade_name: formData.trade_name.trim(),
          document: formData.document.trim(),
          responsible_name: formData.responsible_name.trim(),
          responsible_display_name: formData.responsible_display_name.trim(),
          email_admin: formData.email_admin.trim(),
          phone_whatsapp: formData.phone_whatsapp.trim(),
          phone_landline: formData.phone_landline.trim(),
          address: formData.address.trim(),
          plan: formData.plan,
          subscription_status: formData.subscription_status,
          current_period_end: formData.current_period_end
            ? new Date(`${formData.current_period_end}T23:59:59.000Z`).toISOString()
            : null,
        });
        setIsEditingDetails(false);
      } else {
        toast.error(res.error || "Erro ao salvar alterações.");
      }
    } catch {
      toast.error("Erro inesperado ao salvar alterações.");
    } finally {
      setSavingDetails(false);
    }
  };

  // Redefinir senha
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic.owner?.id) {
      toast.error("Administrador do cliente não localizado.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await updateClientPassword(clinic.owner.id, newPassword);
      if (res.success) {
        toast.success(res.message);
        setNewPassword("");
      } else {
        toast.error(res.error || "Falha ao alterar senha.");
      }
    } catch {
      toast.error("Erro ao alterar senha do cliente.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Botão de texto para voltar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer group py-1"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Voltar para clientes</span>
        </button>

        <span className="text-xs text-muted-foreground">
          Identificador: {clinic.id}
        </span>
      </div>

      {/* Header do Cliente com Identificação e Badges */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-lg">
            {clinic.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                {clinic.name}
              </h2>
              {clinic.trade_name && clinic.trade_name !== clinic.name && (
                <span className="text-xs text-muted-foreground truncate">
                  ({clinic.trade_name})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* Badge do Plano Oficial */}
              <Badge
                variant="outline"
                className={`${OFFICIAL_PLANS[clinic.plan]?.badgeClass || "border-border text-foreground bg-muted/40"} text-xs font-medium`}
              >
                {OFFICIAL_PLANS[clinic.plan]?.name || "Plano Básico"}
              </Badge>

              {/* Badge do Status da Assinatura */}
              <Badge
                variant="outline"
                className={`${statusInfo.badgeClass} text-xs font-medium`}
              >
                {statusInfo.label}
              </Badge>

              {/* Badge do E-mail */}
              <Badge
                variant="outline"
                className={
                  isEmailVerified
                    ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 text-xs"
                    : "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 text-xs"
                }
              >
                {isEmailVerified ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> E-mail Verificado
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> E-mail Pendente
                  </span>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Links Externos: WhatsApp e Página Pública */}
        <div className="flex items-center gap-2 self-start md:self-auto pt-2 md:pt-0">
          {wppLink && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs gap-1.5"
            >
              <a href={wppLink} target="_blank" rel="noopener noreferrer">
                <Whatsapp className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1.5"
          >
            <Link href={`/${clinic.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              Página Pública
            </Link>
          </Button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Ações de Suporte, Assinatura e Edição Colapsada */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Card 1: Situação Financeira e Assinatura */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border/60 bg-card/60 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Situação Financeira e Vencimento
                </h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {clinic.subscription_status === "ACTIVE" ? "Em dia" : "Em teste"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Plano Contratado</span>
                <span className="text-sm font-bold text-foreground">
                  {OFFICIAL_PLANS[clinic.plan]?.name || "Plano Básico"}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Cobrança Mensal
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Vencimento / Renovação</span>
                <span className="text-sm font-bold text-foreground">
                  {clinic.current_period_end
                    ? new Date(clinic.current_period_end).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        timeZone: "UTC",
                      })
                    : clinic.trial_ends_at
                    ? new Date(clinic.trial_ends_at).toLocaleDateString("pt-BR")
                    : "Não definido"}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {clinic.days_until_expiration !== null && clinic.days_until_expiration >= 0
                    ? `Expira em ${clinic.days_until_expiration} dias`
                    : clinic.trial_days_left !== null
                    ? `${clinic.trial_days_left} dias de teste`
                    : "Data de cobrança regular"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Status da Conta</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {clinic.subscription_status === "ACTIVE" ? "Assinatura Ativa" : "Período Gratuito"}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {clinic.subscription_status === "ACTIVE" ? "Pagamento confirmado" : "Avaliação inicial"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Ações Rápidas de Suporte (E-mail pendente, Trial, Troca de Senha) */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border/60 bg-card/60 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Ações Rápidas de Suporte
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Exclusivo Administrador
              </span>
            </div>

            {/* O cartão de verificação de e-mail só aparece se o e-mail NÃO estiver verificado */}
            {!isEmailVerified && clinic.owner && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Confirmação de E-mail Pendente
                  </span>
                  <span className="text-xs text-amber-700/80 dark:text-amber-300/80">
                    O cliente ainda não ativou a conta no e-mail {clinic.email_admin}.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={loadingActionId === `verify-${clinic.owner.id}`}
                    onClick={() => onVerifyEmail(clinic.owner!.id, clinic.id)}
                    className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                  >
                    {loadingActionId === `verify-${clinic.owner.id}` ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    Ativar Agora
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingActionId === `resend-${clinic.owner.id}`}
                    onClick={() => onResendEmail(clinic.owner!.id)}
                    className="rounded-xl text-xs h-8 border-amber-500/30 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20"
                  >
                    {loadingActionId === `resend-${clinic.owner.id}` ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    Reenviar Link
                  </Button>
                </div>
              </div>
            )}

            {/* Prorrogação de Teste (se aplicável) */}
            {clinic.subscription_status === "TRIAL" && (
              <div className="p-4 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    Prorrogação de Período de Teste
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {clinic.trial_days_left !== null && clinic.trial_days_left > 0
                      ? `${clinic.trial_days_left} dias restantes no trial`
                      : "Período de teste expirado"}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingActionId === `extend-${clinic.id}`}
                  onClick={() => onExtendTrial(clinic.id)}
                  className="rounded-xl text-xs h-8"
                >
                  {loadingActionId === `extend-${clinic.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  +7 Dias de Teste
                </Button>
              </div>
            )}

            {/* Redefinição de Senha do Cliente */}
            {clinic.owner && (
              <form
                onSubmit={handleUpdatePassword}
                className="p-4 rounded-xl border border-border/40 bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
              >
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    Trocar Senha do Responsável ({clinic.owner.email})
                  </label>
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha para o cliente (mín. 6 caracteres)..."
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={updatingPassword || !newPassword || newPassword.length < 6}
                  className="rounded-xl text-xs h-9"
                >
                  {updatingPassword ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3 w-3 mr-1.5" />
                  )}
                  Salvar Nova Senha
                </Button>
              </form>
            )}
          </div>

          {/* Card 3: Editar Dados Cadastrais do Cliente (COLAPSADO POR PADRÃO) */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border/60 bg-card/60 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Dados Cadastrais da Empresa
                </h3>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingDetails(!isEditingDetails)}
                className="rounded-xl text-xs gap-1.5 cursor-pointer h-8"
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditingDetails ? "Recolher Edição" : "Editar Dados"}
                {isEditingDetails ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-1" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                )}
              </Button>
            </div>

            {/* Conteúdo Expansível / Colapsado */}
            {isEditingDetails && (
              <form
                onSubmit={handleSaveDetails}
                className="flex flex-col gap-4 pt-3 border-t border-border/40 text-xs animate-in fade-in duration-200"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome da Empresa */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      Nome da Empresa / Estabelecimento *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Serenità Estética"
                      className="h-9 rounded-xl text-xs bg-background"
                      required
                    />
                  </div>

                  {/* Razão Social / Nome Fantasia */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      Razão Social / Nome Fantasia
                    </label>
                    <Input
                      value={formData.trade_name}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                      placeholder="Ex: Serenità LTDA"
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                  </div>

                  {/* Documento (CNPJ ou CPF - Sem font-mono esquisita) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      CNPJ ou CPF
                    </label>
                    <Input
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                  </div>

                  {/* E-mail de Contato / Admin */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      E-mail do Administrador
                    </label>
                    <Input
                      type="email"
                      value={formData.email_admin}
                      onChange={(e) => setFormData({ ...formData, email_admin: e.target.value })}
                      placeholder="contato@empresa.com"
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                  </div>

                  {/* Nome do Responsável */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      Nome do Responsável
                    </label>
                    <Input
                      value={formData.responsible_name}
                      onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                      placeholder="Ex: Mariana Carla"
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                  </div>

                  {/* Como gosta de ser chamado */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      Como gosta de ser chamado
                    </label>
                    <Input
                      value={formData.responsible_display_name}
                      onChange={(e) => setFormData({ ...formData, responsible_display_name: e.target.value })}
                      placeholder="Ex: Mari"
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                  </div>

                  {/* WhatsApp (Sem font-mono) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      WhatsApp de Contato
                    </label>
                    <Input
                      value={formData.phone_whatsapp}
                      onChange={(e) => setFormData({ ...formData, phone_whatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                  </div>

                  {/* Telefone Fixo */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      Telefone Fixo
                    </label>
                    <Input
                      value={formData.phone_landline}
                      onChange={(e) => setFormData({ ...formData, phone_landline: e.target.value })}
                      placeholder="(11) 3333-3333"
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                  </div>

                  {/* Plano Oficial (Select Padronizado) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      Plano Atribuído
                    </label>
                    <Select
                      value={formData.plan}
                      onValueChange={(val) => setFormData({ ...formData, plan: val as OfficialPlan })}
                    >
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASIC">Plano Básico</SelectItem>
                        <SelectItem value="MEDIUM">Plano Padrão</SelectItem>
                        <SelectItem value="ADVANCED">Plano Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status da Assinatura (Select Padronizado) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      Status da Assinatura
                    </label>
                    <Select
                      value={formData.subscription_status}
                      onValueChange={(val) => setFormData({ ...formData, subscription_status: val })}
                    >
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Assinatura Ativa</SelectItem>
                        <SelectItem value="TRIAL">Em Teste (Trial)</SelectItem>
                        <SelectItem value="PAST_DUE">Pagamento Pendente</SelectItem>
                        <SelectItem value="SUSPENDED">Acesso Suspenso</SelectItem>
                        <SelectItem value="CANCELLED">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data de Vencimento da Mensalidade */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Data de Vencimento / Expiração
                    </label>
                    <Input
                      type="date"
                      value={formData.current_period_end}
                      onChange={(e) => setFormData({ ...formData, current_period_end: e.target.value })}
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                  </div>

                  {/* Endereço */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-medium text-foreground">
                      Endereço Completo
                    </label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, cidade - UF"
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border/40">
                  <Button
                    type="submit"
                    disabled={savingDetails}
                    className="rounded-xl text-xs h-9"
                  >
                    {savingDetails ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Coluna 3: Métricas de Uso e Resumo Cadastral */}
        <div className="flex flex-col gap-6">
          {/* Métricas de Uso da Conta */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/60 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-3">
              Métricas de Utilização
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                <span className="text-[11px] text-muted-foreground block">Profissionais</span>
                <span className="text-xl font-bold text-foreground">{clinic.professionals_count}</span>
              </div>

              <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                <span className="text-[11px] text-muted-foreground block">Agendamentos</span>
                <span className="text-xl font-bold text-foreground">{clinic.appointments_count}</span>
              </div>

              <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                <span className="text-[11px] text-muted-foreground block">Clientes</span>
                <span className="text-xl font-bold text-foreground">{clinic.clients_count}</span>
              </div>

              <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                <span className="text-[11px] text-muted-foreground block">Serviços</span>
                <span className="text-xl font-bold text-foreground">{clinic.services_count}</span>
              </div>
            </div>
          </div>

          {/* Dados do Negócio */}
          <div className="p-5 rounded-2xl border border-border/60 bg-card/60 flex flex-col gap-3 text-xs">
            <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-3">
              Resumo Cadastral
            </h3>

            <div className="flex flex-col gap-2.5 text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Responsável:</span>
                <span className="font-medium text-foreground">
                  {clinic.responsible_name}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>E-mail:</span>
                <span className="font-medium text-foreground">
                  {clinic.email_admin}
                </span>
              </div>

              {clinic.document && (
                <div className="flex justify-between items-center">
                  <span>Documento:</span>
                  <span className="font-medium text-foreground">
                    {formatDocument(clinic.document)}
                  </span>
                </div>
              )}

              {clinic.phone_whatsapp && (
                <div className="flex justify-between items-center">
                  <span>WhatsApp:</span>
                  <span className="font-medium text-foreground">
                    {formatPhone(clinic.phone_whatsapp)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                <span>Cliente desde:</span>
                <span className="font-medium text-foreground">
                  {new Date(clinic.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
