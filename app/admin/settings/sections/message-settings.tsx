// app/admin/settings/sections/message-settings.tsx
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

  // 🔥 Busca dados do banco quando carrega
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/settings/messages");
        if (res.ok) {
          const data = await res.json();
          setMsgUpdate(
            data.msgUpdate ||
              "Olá, {nome}! Tudo bem? 💆‍♀️✨\n\nPassando para avisar que seu check-in foi registrado. Você já realizou {usadas} de {total} sessões do seu pacote.",
          );
          setMsgWelcome(
            data.msgWelcome ||
              "Olá, {nome}! Que alegria ter você aqui na nossa empresa. 🥰\n\nSeu pacote de {total} sessões já está ativo no nosso sistema. Qualquer dúvida, é só chamar!",
          );
          setMsgRenewal(
            data.msgRenewal ||
              "Parabéns, {nome}! 🎉 Você concluiu hoje a última sessão do seu pacote.\n\nComo o seu bem-estar é nossa prioridade, que tal já deixarmos o seu próximo pacote garantido? Responda SIM para vermos os horários!",
          );
          setMsgReminder(
            data.msgReminder ||
              "Oi, {nome}! Passando para lembrar do nosso horário agendado para amanhã às {horario}. \n\nPodemos confirmar sua presença? 👍",
          );
        } else {
          toast.error("Erro ao carregar mensagens");
        }
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
        toast.error("Erro de conexão");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // 🔥 Salva TUDO
  const handleSaveAll = async () => {
    setSaving(true);

    try {
      const res = await fetch("/api/settings/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msgUpdate,
          msgWelcome,
          msgRenewal,
          msgReminder,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Mensagens salvas com sucesso!");
      } else {
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro de conexão");
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
            <div
              className={`flex ${isMobile ? "justify-end" : "justify-between"} items-center  gap-2 shrink-0`}
            >
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Recurso de criar novos modelos em breve!")
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Modelo
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className={` ${isMobile ? "hidden" : "max-w-xs"}`}
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

              <AccordionItem value="item-4" className="px-4 border-0">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors">
                  4. Lembrete de Agendamento
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
            </Accordion>
          </div>
        </CardContent>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className={`${!isMobile ? "hidden" : "fixed bottom-0 right-4 md:bottom-8 md:right-8 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 z-50 translate-y-16 opacity-100 hover:scale-110"} `}
        >
          <Save className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </Card>
    </div>
  );
}
