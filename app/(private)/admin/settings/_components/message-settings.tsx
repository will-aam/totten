// app/(private)/admin/settings/_components/message-settings.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Save,
  LoaderDots,
  Plus,
  Whatsapp,
  InfoCircle,
  User,
  CalendarCheck,
  Gift,
} from "@boxicons/react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { updateMessagesAction } from "@/app/actions/messages";
import { DEFAULT_MESSAGE_TEMPLATES } from "@/lib/whatsapp-utils";
import { FloatingSaveButton } from "./floating-save-button";

interface MessageSettingsResponse {
  msgUpdate?: string;
  msgWelcome?: string;
  msgRenewal?: string;
  msgReminder?: string;
  msgManualConfirmation?: string;
  msgBirthday?: string;
}

export function MessageSettings() {
  // SWR: Cache global em memória para evitar requisições repetidas ao alternar tabs
  const {
    data: messagesData,
    isLoading,
    mutate: mutateMessages,
  } = useSWR<MessageSettingsResponse>("settings/messages", apiClient, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60000,
  });

  const [saving, setSaving] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Estados locais para os templates
  const [msgUpdate, setMsgUpdate] = useState("");
  const [msgWelcome, setMsgWelcome] = useState("");
  const [msgRenewal, setMsgRenewal] = useState("");
  const [msgReminder, setMsgReminder] = useState("");
  const [msgManualConfirmation, setMsgManualConfirmation] = useState("");
  const [msgBirthday, setMsgBirthday] = useState("");

  // Sincroniza estados a partir do cache do SWR
  useEffect(() => {
    if (messagesData) {
      setMsgUpdate(messagesData.msgUpdate || DEFAULT_MESSAGE_TEMPLATES.CHECK_IN);
      setMsgWelcome(messagesData.msgWelcome || DEFAULT_MESSAGE_TEMPLATES.WELCOME);
      setMsgRenewal(messagesData.msgRenewal || DEFAULT_MESSAGE_TEMPLATES.RENEWAL);
      setMsgReminder(messagesData.msgReminder || DEFAULT_MESSAGE_TEMPLATES.REMINDER);
      setMsgManualConfirmation(
        messagesData.msgManualConfirmation ||
        DEFAULT_MESSAGE_TEMPLATES.MANUAL_CONFIRMATION,
      );
      setMsgBirthday(messagesData.msgBirthday || DEFAULT_MESSAGE_TEMPLATES.BIRTHDAY);
    }
  }, [messagesData]);

  const handleSaveAll = async () => {
    setSaving(true);

    const payload = {
      msgUpdate,
      msgWelcome,
      msgRenewal,
      msgReminder,
      msgManualConfirmation,
      msgBirthday,
    };

    try {
      const result = await updateMessagesAction(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        await mutateMessages(payload, false);
        toast.success(result.message || "Mensagens salvas com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro de conexão com o servidor");
    } finally {
      setSaving(false);
    }
  };

  // Skeleton state: apenas no primeiro carregamento
  if (isLoading && !messagesData) {
    return (
      <Card className="border-none shadow-none bg-transparent rounded-none md:rounded-3xl md:border md:border-border/60 md:bg-card md:shadow-xs overflow-hidden">
        <CardHeader className="px-0 pt-0 pb-4 md:p-6 md:pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-80 rounded-lg" />
            </div>
            <div className="hidden md:flex gap-2">
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-28 rounded-full" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 md:p-6 md:pt-4 grid gap-4">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent rounded-none md:rounded-3xl md:border md:border-border/60 md:bg-card md:shadow-xs overflow-hidden">
      {/* Header: chapado no mobile (px-0 pt-0), com padding e acabamento de card no desktop */}
      <CardHeader className="px-0 pt-0 pb-4 md:p-6 md:pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Whatsapp className="h-6 w-6 text-[#25D366]" />
              Modelos de Mensagens (WhatsApp)
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Personalize os modelos pré-formatados que sua equipe utiliza ao clicar nos botões de WhatsApp espalhados pelo sistema.
            </CardDescription>
          </div>

          {/* Grupo de Botões */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() =>
                toast.info("Recurso de criar novos modelos em breve!")
              }
              className="h-11 px-5 rounded-full font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Modelo
            </Button>

            <Button
              onClick={handleSaveAll}
              disabled={saving}
              className="hidden md:flex h-11 px-6 font-semibold rounded-full shadow-sm"
            >
              {saving ? (
                <>
                  <LoaderDots className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:p-6 md:pt-4 grid gap-6">
        <div>
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-sm">
                Mensagens Padrão do Sistema
              </Label>
              <button
                type="button"
                onClick={() => setShowTip(!showTip)}
                className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-full bg-muted/50 hover:bg-muted"
                title="Dicas de funcionamento e variáveis"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>

            {showTip && (
              <div className="bg-primary/10 text-primary p-4 rounded-2xl border border-primary/20 text-xs animate-in fade-in duration-300 space-y-2">
                <div className="flex items-start gap-2.5">
                  <InfoCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <div className="space-y-1.5 leading-relaxed text-foreground">
                    <p className="font-bold text-xs text-primary">
                      Como funcionam os modelos e variáveis?
                    </p>
                    <p className="text-muted-foreground">
                      Esses textos são carregados prontos para envio quando você ou sua equipe clica em <b>Enviar Mensagem</b> ou no ícone do WhatsApp nas respectivas telas (Ficha do Cliente, Agenda de Confirmações e Aniversariantes).
                    </p>
                    <p className="text-muted-foreground">
                      As variáveis entre chaves (como{" "}
                      <code className="bg-background px-1.5 py-0.5 rounded-md font-mono text-primary font-bold">
                        {"{nome}"}
                      </code>
                      ) são substituídas automaticamente pelos dados reais do cliente antes de abrir a conversa no WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Accordion
            type="single"
            collapsible
            defaultValue="item-1"
            className="w-full border border-border/50 rounded-2xl bg-card divide-y divide-border/40 overflow-hidden"
          >
            {/* 1. ATUALIZAÇÃO DE PACOTE (CHECK-IN) */}
            <AccordionItem value="item-1" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors py-4">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <span className="text-sm font-semibold text-foreground">
                    1. Atualização de Pacote (Check-in)
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  >
                    Ficha do Cliente
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-1 space-y-3">
                <Textarea
                  rows={4}
                  value={msgUpdate}
                  onChange={(e) => setMsgUpdate(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <div className="bg-muted/40 p-3 rounded-xl text-xs space-y-1 text-muted-foreground">
                  <p>
                    <b className="text-foreground">Onde é utilizada:</b> Na <b>Ficha do Cliente</b> (Menu Clientes &gt; Ver Cliente), dentro do botão <i>Enviar Mensagem</i> &gt; opção <b>Atualização (Check-in)</b>.
                  </p>
                  <p>
                    <b className="text-foreground">Objetivo:</b> Avisar ao cliente quantas sessões do pacote ele já utilizou e quantas ainda restam.
                  </p>
                  <p className="pt-1">
                    <b className="text-foreground">Variáveis disponíveis:</b>{" "}
                    <code className="text-primary font-mono font-medium">{"{nome}"}</code>,{" "}
                    <code className="text-primary font-mono font-medium">{"{usadas}"}</code>,{" "}
                    <code className="text-primary font-mono font-medium">{"{total}"}</code>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. BOAS-VINDAS (NOVO PACOTE) */}
            <AccordionItem value="item-3" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors py-4">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <span className="text-sm font-semibold text-foreground">
                    2. Boas-vindas (Novo Pacote)
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  >
                    Ficha do Cliente
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-1 space-y-3">
                <Textarea
                  rows={4}
                  value={msgWelcome}
                  onChange={(e) => setMsgWelcome(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <div className="bg-muted/40 p-3 rounded-xl text-xs space-y-1 text-muted-foreground">
                  <p>
                    <b className="text-foreground">Onde é utilizada:</b> Na <b>Ficha do Cliente</b> (Menu Clientes &gt; Ver Cliente), dentro do botão <i>Enviar Mensagem</i> &gt; opção <b>Boas-vindas</b>.
                  </p>
                  <p>
                    <b className="text-foreground">Objetivo:</b> Dar as boas-vindas logo após o cliente adquirir um novo pacote de sessões na clínica.
                  </p>
                  <p className="pt-1">
                    <b className="text-foreground">Variáveis disponíveis:</b>{" "}
                    <code className="text-primary font-mono font-medium">{"{nome}"}</code>,{" "}
                    <code className="text-primary font-mono font-medium">{"{total}"}</code>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. RENOVAÇÃO DE PACOTE (UPSELL) */}
            <AccordionItem value="item-2" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors py-4">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <span className="text-sm font-semibold text-foreground">
                    3. Renovação de Pacote (Upsell)
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  >
                    Ficha do Cliente
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-1 space-y-3">
                <Textarea
                  rows={4}
                  value={msgRenewal}
                  onChange={(e) => setMsgRenewal(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <div className="bg-muted/40 p-3 rounded-xl text-xs space-y-1 text-muted-foreground">
                  <p>
                    <b className="text-foreground">Onde é utilizada:</b> Na <b>Ficha do Cliente</b> (Menu Clientes &gt; Ver Cliente), dentro do botão <i>Enviar Mensagem</i> &gt; opção <b>Renovação de Pacote</b>.
                  </p>
                  <p>
                    <b className="text-foreground">Objetivo:</b> Incentivar uma nova compra quando o cliente concluir ou estiver na última sessão do pacote atual.
                  </p>
                  <p className="pt-1">
                    <b className="text-foreground">Variáveis disponíveis:</b>{" "}
                    <code className="text-primary font-mono font-medium">{"{nome}"}</code>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. LEMBRETE PONTUAL DE AGENDAMENTO */}
            <AccordionItem value="item-4" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors py-4">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <span className="text-sm font-semibold text-foreground">
                    4. Lembrete de Horário (Ficha)
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  >
                    Ficha do Cliente
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-1 space-y-3">
                <Textarea
                  rows={3}
                  value={msgReminder}
                  onChange={(e) => setMsgReminder(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <div className="bg-muted/40 p-3 rounded-xl text-xs space-y-1 text-muted-foreground">
                  <p>
                    <b className="text-foreground">Onde é utilizada:</b> Na <b>Ficha do Cliente</b> (Menu Clientes &gt; Ver Cliente), dentro do botão <i>Enviar Mensagem</i> &gt; opção <b>Lembrete de Agenda</b>.
                  </p>
                  <p>
                    <b className="text-foreground">Objetivo:</b> Relembrar rapidamente um cliente sobre o horário agendado diretamente pela ficha cadastral dele.
                  </p>
                  <p className="pt-1">
                    <b className="text-foreground">Variáveis disponíveis:</b>{" "}
                    <code className="text-primary font-mono font-medium">{"{nome}"}</code>,{" "}
                    <code className="text-primary font-mono font-medium">{"{horario}"}</code>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. CONFIRMAÇÃO MANUAL (AGENDA DE AMANHÃ) */}
            <AccordionItem value="item-5" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors py-4">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <span className="text-sm font-semibold text-foreground">
                    5. Confirmação de Horário de Amanhã
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  >
                    Confirmações e Lembretes
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-1 space-y-3">
                <Textarea
                  rows={3}
                  value={msgManualConfirmation}
                  onChange={(e) => setMsgManualConfirmation(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <div className="bg-muted/40 p-3 rounded-xl text-xs space-y-1 text-muted-foreground">
                  <p>
                    <b className="text-foreground">Onde é utilizada:</b> Na tela de <b>Confirmações e Lembretes</b> (Menu Lembretes / Agenda de Amanhã), no botão verde de WhatsApp ao lado de cada agendamento.
                  </p>
                  <p>
                    <b className="text-foreground">Objetivo:</b> Confirmar com 1 clique a presença dos pacientes/clientes agendados para o dia seguinte, reduzindo faltas.
                  </p>
                  <p className="pt-1">
                    <b className="text-foreground">Variáveis disponíveis:</b>{" "}
                    <code className="text-primary font-mono font-medium">{"{nome}"}</code>,{" "}
                    <code className="text-primary font-mono font-medium">{"{horario}"}</code>,{" "}
                    <code className="text-primary font-mono font-medium">{"{servico}"}</code>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 6. MENSAGEM DE ANIVERSÁRIO */}
            <AccordionItem value="item-6" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors py-4">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <span className="text-sm font-semibold text-foreground">
                    6. Mensagem de Feliz Aniversário
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                  >
                    Aniversariantes
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-1 space-y-3">
                <Textarea
                  rows={3}
                  value={msgBirthday}
                  onChange={(e) => setMsgBirthday(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <div className="bg-muted/40 p-3 rounded-xl text-xs space-y-1 text-muted-foreground">
                  <p>
                    <b className="text-foreground">Onde é utilizada:</b> Na tela de <b>Aniversariantes</b> (Menu Aniversariantes), no botão de WhatsApp ao lado de cada aniversariante da semana/mês.
                  </p>
                  <p>
                    <b className="text-foreground">Objetivo:</b> Felicitar o cliente pelo seu aniversário e fortalecer o relacionamento com a clínica.
                  </p>
                  <p className="pt-1">
                    <b className="text-foreground">Variáveis disponíveis:</b>{" "}
                    <code className="text-primary font-mono font-medium">{"{nome}"}</code>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>

      {/* Botão flutuante mobile circular padrão via Portal */}
      <FloatingSaveButton
        onClick={handleSaveAll}
        disabled={saving || isLoading}
        loading={saving}
        ariaLabel="Salvar mensagens"
      />
    </Card>
  );
}
