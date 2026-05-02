"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "@boxicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WhatsAppButtonProps {
  clientName: string;
  clientPhone: string;
  usedSessions?: number;
  totalSessions?: number;
}

export function WhatsAppButton({
  clientName,
  clientPhone,
  usedSessions = 0,
  totalSessions = 10,
}: WhatsAppButtonProps) {
  const [templates, setTemplates] = useState({
    msgUpdate:
      "Olá, {nome}! Tudo bem? 💆‍♀️✨\n\nPassando para avisar que seu check-in foi registrado. Você já realizou {usadas} de {total} sessões do seu pacote.",
    msgWelcome:
      "Olá, {nome}! Que alegria ter você aqui na nossa empresa. 🥰\n\nSeu pacote de {total} sessões já está ativo no nosso sistema. Qualquer dúvida, é só chamar!",
    msgRenewal:
      "Parabéns, {nome}! 🎉 Você concluiu hoje a última sessão do seu pacote.\n\nComo o seu bem-estar é nossa prioridade, que tal já deixarmos o seu próximo pacote garantido? Responda SIM para vermos os horários!",
    msgReminder:
      "Oi, {nome}! Passando para lembrar do nosso horário agendado para amanhã às {horario}. \n\nPodemos confirmar sua presença? 👍",
  });

  // Busca os dados frescos do Banco de Dados!
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/settings/messages");
        if (res.ok) {
          const data = await res.json();
          setTemplates((prev) => ({
            msgUpdate: data.msgUpdate || prev.msgUpdate,
            msgWelcome: data.msgWelcome || prev.msgWelcome,
            msgRenewal: data.msgRenewal || prev.msgRenewal,
            msgReminder: data.msgReminder || prev.msgReminder,
          }));
        }
      } catch (e) {
        console.error("Erro ao carregar templates do WhatsApp", e);
      }
    };

    fetchTemplates();
  }, []);

  const formatMessage = (template: string) => {
    const nomeCurto = clientName ? clientName.split(" ")[0] : "";
    return template
      .replace(/{nome}/g, nomeCurto)
      .replace(/{usadas}/g, usedSessions.toString())
      .replace(/{total}/g, totalSessions.toString())
      .replace(/{horario}/g, "09:00");
  };

  // 🔥 Nova função blindada usando o objeto URL nativo
  const handleSend = (templateText: string) => {
    if (!clientPhone) {
      alert("Este cliente não tem um número de WhatsApp cadastrado.");
      return;
    }

    const rawPhone = clientPhone.replace(/\D/g, "");
    let targetPhone = rawPhone;

    if (!rawPhone.startsWith("55") || rawPhone.length < 12) {
      targetPhone = `55${rawPhone}`;
    }

    if (targetPhone.length < 12) {
      alert("O número de WhatsApp cadastrado parece inválido.");
      return;
    }

    const message = formatMessage(templateText);

    // API nativa de URL do navegador (Imune a corrupção de caracteres)
    const url = new URL("https://api.whatsapp.com/send");
    url.searchParams.set("phone", targetPhone);
    url.searchParams.set("text", message);

    window.open(url.toString(), "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 bg-emerald-50/50"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Enviar Mensagem</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleSend(templates.msgUpdate)}
          className="cursor-pointer"
        >
          <span className="flex-1">Atualização de Pacote</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSend(templates.msgWelcome)}
          className="cursor-pointer"
        >
          <span className="flex-1">Boas-vindas</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSend(templates.msgRenewal)}
          className="cursor-pointer"
        >
          <span className="flex-1">Renovação de Pacote</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSend(templates.msgReminder)}
          className="cursor-pointer"
        >
          <span className="flex-1">Lembrete de Agendamento</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
