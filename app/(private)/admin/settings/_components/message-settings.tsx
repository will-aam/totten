// app/(private)/admin/settings/_components/message-settings.tsx
"use client";

import { useState, useEffect } from "react";
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
import { HelpCircle, Save, LoaderDots, Plus } from "@boxicons/react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import { updateMessagesAction } from "@/app/actions/messages";
import { DEFAULT_MESSAGE_TEMPLATES } from "@/lib/whatsapp-utils";

interface MessageSettingsResponse {
  msgUpdate?: string;
  msgWelcome?: string;
  msgRenewal?: string;
  msgReminder?: string;
  msgManualConfirmation?: string;
  msgBirthday?: string;
}

export function MessageSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Estados para os diferentes templates
  const [msgUpdate, setMsgUpdate] = useState("");
  const [msgWelcome, setMsgWelcome] = useState("");
  const [msgRenewal, setMsgRenewal] = useState("");
  const [msgReminder, setMsgReminder] = useState("");
  const [msgManualConfirmation, setMsgManualConfirmation] = useState("");
  const [msgBirthday, setMsgBirthday] = useState("");

  // Busca dados do banco quando carrega
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data =
          await apiClient<MessageSettingsResponse>("settings/messages");

        setMsgUpdate(data.msgUpdate || DEFAULT_MESSAGE_TEMPLATES.CHECK_IN);
        setMsgWelcome(data.msgWelcome || DEFAULT_MESSAGE_TEMPLATES.WELCOME);
        setMsgRenewal(data.msgRenewal || DEFAULT_MESSAGE_TEMPLATES.RENEWAL);
        setMsgReminder(data.msgReminder || DEFAULT_MESSAGE_TEMPLATES.REMINDER);
        setMsgManualConfirmation(
          data.msgManualConfirmation ||
          DEFAULT_MESSAGE_TEMPLATES.MANUAL_CONFIRMATION,
        );
        setMsgBirthday(data.msgBirthday || DEFAULT_MESSAGE_TEMPLATES.BIRTHDAY);
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
        if (error instanceof ApiError) {
          toast.error("Erro ao carregar mensagens");
        } else {
          toast.error("Erro de conexão");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);

    try {
      const result = await updateMessagesAction({
        msgUpdate,
        msgWelcome,
        msgRenewal,
        msgReminder,
        msgManualConfirmation,
        msgBirthday,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(result.message || "Mensagens salvas com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro de conexão com o servidor");
    } finally {
      setSaving(false);
    }
  };

  // Skeleton state conforme diretriz pages-standard.md
  if (loading) {
    return (
      <Card className="rounded-2xl md:rounded-3xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-5 md:p-6 border-b border-border/40 bg-muted/10">
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
        <CardContent className="p-5 md:p-6 grid gap-4">
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
    <Card className="rounded-2xl md:rounded-3xl border border-border/60 bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-5 md:p-6 border-b border-border/40 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Modelos de Mensagens
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Personalize os textos que o sistema enviará aos seus clientes.
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

      <CardContent className="p-5 md:p-6 grid gap-6">
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
                title="Dicas de variáveis"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>

            {showTip && (
              <div className="bg-primary/10 text-primary px-3.5 py-3 rounded-xl border border-primary/20 text-xs animate-in fade-in duration-300">
                💡 <b>Dica:</b> Use as variáveis entre chaves (ex:{" "}
                <code className="bg-background px-1.5 py-0.5 rounded-md font-mono text-primary font-bold">
                  {"{nome}"}
                </code>
                ) para o sistema personalizar automaticamente antes de enviar.
              </div>
            )}
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full border border-border/50 rounded-2xl bg-card divide-y divide-border/40 overflow-hidden"
          >
            <AccordionItem value="item-1" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm font-semibold py-4">
                1. Atualização de Pacote (Check-in)
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">
                <Textarea
                  rows={4}
                  value={msgUpdate}
                  onChange={(e) => setMsgUpdate(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enviada quando o cliente faz check-in no Totem. <br />
                  Variáveis: <code className="text-primary font-mono font-medium">{"{nome}"}</code>, <code className="text-primary font-mono font-medium">{"{usadas}"}</code>,{" "}
                  <code className="text-primary font-mono font-medium">{"{total}"}</code>
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm font-semibold py-4">
                2. Renovação de Pacote (Upsell)
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">
                <Textarea
                  rows={4}
                  value={msgRenewal}
                  onChange={(e) => setMsgRenewal(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enviada na última sessão do pacote para incentivar uma nova compra. <br />
                  Variáveis: <code className="text-primary font-mono font-medium">{"{nome}"}</code>
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm font-semibold py-4">
                3. Boas-vindas (Novo Pacote)
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">
                <Textarea
                  rows={4}
                  value={msgWelcome}
                  onChange={(e) => setMsgWelcome(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enviada quando um novo pacote é adicionado no painel. <br />
                  Variáveis: <code className="text-primary font-mono font-medium">{"{nome}"}</code>, <code className="text-primary font-mono font-medium">{"{total}"}</code>
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm font-semibold py-4">
                4. Lembrete de Agendamento Automático
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">
                <Textarea
                  rows={3}
                  value={msgReminder}
                  onChange={(e) => setMsgReminder(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Variáveis: <code className="text-primary font-mono font-medium">{"{nome}"}</code>,{" "}
                  <code className="text-primary font-mono font-medium">{"{horario}"}</code>
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm font-semibold py-4">
                5. Confirmação Manual (WhatsApp)
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">
                <Textarea
                  rows={3}
                  value={msgManualConfirmation}
                  onChange={(e) => setMsgManualConfirmation(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Mensagem acionada pelo botão do WhatsApp na página de
                  Confirmações e Lembretes. <br />
                  Variáveis: <code className="text-primary font-mono font-medium">{"{nome}"}</code>,{" "}
                  <code className="text-primary font-mono font-medium">{"{horario}"}</code>,{" "}
                  <code className="text-primary font-mono font-medium">{"{servico}"}</code>
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="px-4 md:px-5 border-none">
              <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors text-sm font-semibold py-4">
                6. Mensagem de Aniversário (WhatsApp)
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1">
                <Textarea
                  rows={3}
                  value={msgBirthday}
                  onChange={(e) => setMsgBirthday(e.target.value)}
                  className="resize-none bg-muted/30 focus-visible:ring-primary rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Mensagem acionada pelo botão do WhatsApp na página de
                  Aniversariantes. <br />
                  Variáveis: <code className="text-primary font-mono font-medium">{"{nome}"}</code>
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>

      {/* Botão flutuante mobile circular padrão */}
      <button
        type="button"
        onClick={handleSaveAll}
        disabled={saving || loading}
        className="md:hidden fixed bottom-28 right-6 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform duration-300 z-50 hover:scale-105 active:scale-95"
        aria-label="Salvar mensagens"
      >
        {saving ? (
          <LoaderDots className="h-6 w-6 animate-spin" />
        ) : (
          <Save className="h-6 w-6" strokeWidth={2.5} />
        )}
      </button>
    </Card>
  );
}
