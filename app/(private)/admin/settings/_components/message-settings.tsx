// app/(private)/admin/settings/_components/message-settings.tsx
"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { Whatsapp, HelpCircle, Save, LoaderDots, Plus } from "@boxicons/react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiClient, ApiError } from "@/lib/api-client";
// 🔌 Importando a nossa Server Action nativa
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
  const isMobile = useIsMobile();
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

  // 🔌 Salva TUDO usando a Server Action
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

  // Loading state
  if (loading) {
    return (
      <Card className="border-none shadow-none py-0 sm:py-6">
        <CardContent className="flex items-center justify-center py-12">
          <LoaderDots className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none shadow-none py-0 sm:py-6">
        <CardHeader className="px-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Whatsapp className="h-5 w-5 text-primary" />
                Modelos de Mensagens
              </CardTitle>
              <CardDescription className="mt-1.5">
                Personalize os textos que o sistema enviará aos seus clientes.
              </CardDescription>
            </div>

            {/* Grupo de Botões */}
            <div className="flex justify-end md:justify-between items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Recurso de criar novos modelos em breve!")
                }
                className="h-12 px-8 font-medium shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Modelo
              </Button>

              {/* 📱 Escondemos este botão no mobile para não duplicar com o flutuante */}
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className="hidden md:flex h-12 px-8 font-medium shadow-sm"
              >
                {saving ? (
                  <>
                    <LoaderDots className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 px-0 pb-0 md:pb-6 md:px-6">
          {/* Templates de Mensagem com Accordion */}
          <div>
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-medium text-base">
                  Mensagens Padrão do Sistema
                </Label>
                <button
                  type="button"
                  onClick={() => setShowTip(!showTip)}
                  className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-full bg-muted/50 hover:bg-muted"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>

              {showTip && (
                <div className="bg-primary/10 text-primary px-3 py-2.5 rounded-md border border-primary/20 text-[13px] animate-in fade-in slide-in-from-top-2">
                  💡 <b>Dica:</b> Use as variáveis entre chaves (ex:{" "}
                  <code className="bg-background px-1 py-0.5 rounded text-primary">
                    {"{nome}"}
                  </code>
                  ) para o sistema personalizar automaticamente antes de enviar.
                </div>
              )}
            </div>

            <Accordion
              type="single"
              collapsible
              className="w-full border rounded-lg bg-card"
            >
              <AccordionItem value="item-1" className="border-b px-4">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">
                  1. Atualização de Pacote (Check-in)
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <Textarea
                    rows={4}
                    value={msgUpdate}
                    onChange={(e) => setMsgUpdate(e.target.value)}
                    className="resize-none bg-muted focus-visible:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enviada quando o cliente faz check-in no Totem. <br />
                    Variáveis: <code className="text-primary">
                      {"{nome}"}
                    </code>, <code className="text-primary">{"{usadas}"}</code>,{" "}
                    <code className="text-primary">{"{total}"}</code>
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b px-4">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">
                  2. Renovação de Pacote (Upsell)
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <Textarea
                    rows={4}
                    value={msgRenewal}
                    onChange={(e) => setMsgRenewal(e.target.value)}
                    className="resize-none bg-muted focus-visible:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enviada na última sessão do pacote para incentivar uma nova
                    compra. <br />
                    Variáveis: <code className="text-primary">{"{nome}"}</code>
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b px-4">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">
                  3. Boas-vindas (Novo Pacote)
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <Textarea
                    rows={4}
                    value={msgWelcome}
                    onChange={(e) => setMsgWelcome(e.target.value)}
                    className="resize-none bg-muted focus-visible:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enviada quando um novo pacote é adicionado no painel. <br />
                    Variáveis: <code className="text-primary">
                      {"{nome}"}
                    </code>, <code className="text-primary">{"{total}"}</code>
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b px-4">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">
                  4. Lembrete de Agendamento Automático
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <Textarea
                    rows={3}
                    value={msgReminder}
                    onChange={(e) => setMsgReminder(e.target.value)}
                    className="resize-none bg-muted focus-visible:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Variáveis: <code className="text-primary">{"{nome}"}</code>,{" "}
                    <code className="text-primary">{"{horario}"}</code>
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b px-4">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">
                  5. Confirmação Manual (WhatsApp)
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <Textarea
                    rows={3}
                    value={msgManualConfirmation}
                    onChange={(e) => setMsgManualConfirmation(e.target.value)}
                    className="resize-none bg-muted focus-visible:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Mensagem acionada pelo botão do WhatsApp na página de
                    Confirmações e Lembretes. <br />
                    Variáveis: <code className="text-primary">
                      {"{nome}"}
                    </code>, <code className="text-primary">{"{horario}"}</code>
                    , <code className="text-primary">{"{servico}"}</code>
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="px-4 border-0">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">
                  6. Mensagem de Aniversário (WhatsApp)
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <Textarea
                    rows={3}
                    value={msgBirthday}
                    onChange={(e) => setMsgBirthday(e.target.value)}
                    className="resize-none bg-muted focus-visible:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Mensagem acionada pelo botão do WhatsApp na página de
                    Aniversariantes. <br />
                    Variáveis: <code className="text-primary">{"{nome}"}</code>
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>

        {/* 📱 Botão flutuante corrigido para ficar acima da nav bottom (bottom-24) */}
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className={`${!isMobile ? "hidden" : "fixed bottom-24 right-4 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 z-50 hover:scale-105 active:scale-95"} `}
        >
          {saving ? (
            <LoaderDots className="h-6 w-6 animate-spin" />
          ) : (
            <Save className="h-6 w-6" strokeWidth={2.5} />
          )}
        </button>
      </Card>
    </div>
  );
}
