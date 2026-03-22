// components/client/client-contact.tsx
"use client";

import { useState, useEffect } from "react";
import { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Mail,
  Pencil,
  Check,
  X,
  Loader2,
  Share2,
  CalendarIcon,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type ClientContactType = {
  id: string;
  name: string;
  cpf: string;
  phone_whatsapp: string;
  email?: string | null;
  birth_date?: string | null;
  zip_code?: string | null;
  city?: string | null;
  street?: string | null;
  number?: string | null;
};

interface ClientContactProps {
  client: ClientContactType;
}

// Máscaras de Input
function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatCepInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

// 🔥 Nova máscara para a Data de Nascimento (DD/MM/AAAA)
function formatDateInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
}

function parseDate(dateStr: string | null | undefined) {
  if (!dateStr) return undefined;
  const pureDate = dateStr.split("T")[0];
  return new Date(`${pureDate}T12:00:00`);
}

function initDateStr(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = parseDate(dateStr);
  return d ? format(d, "dd/MM/yyyy") : "";
}

export function ClientContact({ client }: ClientContactProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editPhone, setEditPhone] = useState(client.phone_whatsapp || "");
  const [editEmail, setEditEmail] = useState(client.email || "");
  
  // 🔥 Data agora é controlada como string para facilitar a digitação da usuária
  const [editBirthDate, setEditBirthDate] = useState(initDateStr(client.birth_date));
  
  const [editZipCode, setEditZipCode] = useState(client.zip_code || "");
  const [editCity, setEditCity] = useState(client.city || "");
  const [editStreet, setEditStreet] = useState(client.street || "");
  const [editNumber, setEditNumber] = useState(client.number || "");

  const [templates, setTemplates] = useState({
    msgUpdate:
      "Olá, {nome}! Tudo bem? 💆‍♀️✨\n\nPassando para avisar que seu check-in foi registrado.",
    msgWelcome: "Olá, {nome}! Que alegria ter você aqui na nossa empresa. 🥰",
    msgRenewal:
      "Parabéns, {nome}! 🎉 Você concluiu hoje a última sessão do seu pacote.",
    msgReminder:
      "Oi, {nome}! Passando para lembrar do nosso horário agendado. 👍",
  });

  useEffect(() => {
    const savedTemplates = localStorage.getItem("whatsapp_templates");
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Erro ao carregar templates do WhatsApp", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setEditPhone(client.phone_whatsapp || "");
      setEditEmail(client.email || "");
      setEditBirthDate(initDateStr(client.birth_date));
      setEditZipCode(client.zip_code || "");
      setEditCity(client.city || "");
      setEditStreet(client.street || "");
      setEditNumber(client.number || "");
    }
  }, [client, isEditing]);

  const handleCancel = () => {
    setIsEditing(false);
    setEditPhone(client.phone_whatsapp || "");
    setEditEmail(client.email || "");
    setEditBirthDate(initDateStr(client.birth_date));
    setEditZipCode(client.zip_code || "");
    setEditCity(client.city || "");
    setEditStreet(client.street || "");
    setEditNumber(client.number || "");
  };

  const handleSave = async () => {
    const cleanPhone = editPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("O WhatsApp é obrigatório. Informe DDD + número.");
      return;
    }

    const isEmailValid =
      !editEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail);
    if (!isEmailValid) {
      toast.error("O E-mail inserido é inválido.");
      return;
    }

    // 🔥 Validação e Formatação da Data de Nascimento (DD/MM/AAAA para YYYY-MM-DD)
    let formattedBirthDate = null;
    if (editBirthDate.length === 10) {
      const [day, month, year] = editBirthDate.split("/");
      formattedBirthDate = `${year}-${month}-${day}`;
      
      const d = new Date(`${formattedBirthDate}T12:00:00Z`);
      if (isNaN(d.getTime()) || d.getFullYear() > new Date().getFullYear() || d.getFullYear() < 1900) {
        toast.error("A data de nascimento informada é inválida.");
        return;
      }
    } else if (editBirthDate.length > 0 && editBirthDate.length < 10) {
      toast.error("A data de nascimento está incompleta. Use DD/MM/AAAA.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client.name,
          cpf: client.cpf,
          phone_whatsapp: editPhone,
          email: editEmail || null,
          birth_date: formattedBirthDate, // Envia para o banco já no formato correto
          zip_code: editZipCode || null,
          city: editCity || null,
          street: editStreet || null,
          number: editNumber || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload?.error || "Erro ao salvar a ficha.");
      }

      toast.success("Ficha do cliente atualizada com sucesso!");
      setIsEditing(false);
      mutate(`/api/clients/${client.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const formatMessage = (template: string) => {
    const nomeCurto = client.name.split(" ")[0];
    return template
      .replace(/{nome}/g, nomeCurto)
      .replace(/{usadas}/g, "-")
      .replace(/{total}/g, "-")
      .replace(/{horario}/g, "09:00");
  };

  const handleSendWhatsApp = (templateText: string) => {
    const cleanPhone = client.phone_whatsapp?.replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error(
        "O cliente não possui um número de WhatsApp válido cadastrado.",
      );
      return;
    }

    const message = formatMessage(templateText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  const handleEmail = () => {
    if (!client.email) {
      toast.error("Este cliente não possui e-mail cadastrado.");
      return;
    }
    window.open(`mailto:${client.email}`, "_self");
  };

  const addressParts = [];
  if (client.street)
    addressParts.push(
      `${client.street}${client.number ? `, ${client.number}` : ""}`,
    );
  if (client.city) addressParts.push(client.city);
  if (client.zip_code) addressParts.push(client.zip_code);
  const addressDisplay = addressParts.join(" - ");

  return (
    <Card className="md:col-span-2 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-3 md:pb-6 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <Share2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
          Contato e Ficha
        </CardTitle>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <div className="flex gap-1">
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 text-muted-foreground select-none transition-transform duration-100 ease-out hover:bg-transparent active:scale-90 active:brightness-90"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 text-[#25D366] select-none transition-transform duration-100 ease-out hover:bg-transparent active:scale-90 active:brightness-90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" strokeWidth={3} />
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              size="icon"
              variant="ghost"
              className="text-muted-foreground rounded-full h-8 w-8 select-none transition-transform duration-100 ease-out hover:bg-transparent hover:text-muted-foreground active:scale-90 active:text-primary active:brightness-90"
              title="Completar / Editar ficha"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-5">
        {isEditing ? (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            {/* DADOS DE CONTATO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  WhatsApp *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  </div>
                  <Input
                    value={editPhone}
                    onChange={(e) =>
                      setEditPhone(formatPhoneInput(e.target.value))
                    }
                    placeholder="(00) 00000-0000"
                    className="pl-9 h-10 bg-muted/30 focus-visible:ring-[#25D366]/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <Input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="pl-9 h-10 bg-muted/30"
                  />
                </div>
              </div>
            </div>

            {/* NASCIMENTO E CEP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Nascimento
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {/* 🔥 Agora é um Input simples com máscara */}
                  <Input
                    value={editBirthDate}
                    onChange={(e) =>
                      setEditBirthDate(formatDateInput(e.target.value))
                    }
                    placeholder="DD/MM/AAAA"
                    className="pl-9 h-10 bg-muted/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  CEP
                </Label>
                <Input
                  value={editZipCode}
                  onChange={(e) =>
                    setEditZipCode(formatCepInput(e.target.value))
                  }
                  placeholder="00000-000"
                  className="h-10 bg-muted/30 font-mono"
                />
              </div>
            </div>

            {/* ENDEREÇO */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="space-y-1.5 sm:col-span-5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Cidade
                </Label>
                <Input
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="Sua cidade"
                  className="h-10 bg-muted/30"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Rua / Logradouro
                </Label>
                <Input
                  value={editStreet}
                  onChange={(e) => setEditStreet(e.target.value)}
                  placeholder="Ex: Avenida Central"
                  className="h-10 bg-muted/30"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Número
                </Label>
                <Input
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  placeholder="Ex: 123"
                  className="h-10 bg-muted/30"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* 1. BOTÕES DE AÇÃO */}
            <div className="flex flex-col sm:flex-row gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full flex-1 h-12 text-base border-[#25D366]/20 select-none transition-transform duration-100 ease-out hover:bg-transparent active:scale-95 active:bg-[#25D366]/10"
                  >
                    <MessageCircle className="mr-2 h-5 w-5 text-[#25D366]" />{" "}
                    WhatsApp
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-70">
                  <DropdownMenuLabel>Qual mensagem enviar?</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleSendWhatsApp(templates.msgUpdate)}
                    className="cursor-pointer py-2 select-none transition-colors hover:bg-transparent focus:bg-muted/50 data-highlighted:bg-muted/50"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">
                        Atualização (Check-in)
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        Olá {client.name.split(" ")[0]}, seu check-in...
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSendWhatsApp(templates.msgWelcome)}
                    className="cursor-pointer py-2 select-none transition-colors hover:bg-transparent focus:bg-muted/50 data-highlighted:bg-muted/50"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">
                        Boas-vindas (Novo)
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        Que alegria ter você aqui...
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSendWhatsApp(templates.msgRenewal)}
                    className="cursor-pointer py-2 select-none transition-colors hover:bg-transparent focus:bg-muted/50 data-highlighted:bg-muted/50"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">
                        Renovação de Pacote
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        Você concluiu a última sessão...
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSendWhatsApp(templates.msgReminder)}
                    className="cursor-pointer py-2 select-none transition-colors hover:bg-transparent focus:bg-muted/50 data-highlighted:bg-muted/50"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">
                        Lembrete de Agenda
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        Passando para lembrar do nosso...
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 2. INFORMAÇÕES VISUAIS DA FICHA COMPLETA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-border/40">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </span>
                <span className="text-sm font-medium text-foreground">
                  {client.phone_whatsapp || "Não informado"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> E-mail
                </span>
                <span className="text-sm font-medium text-foreground">
                  {client.email || "Não informado"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <CalendarIcon className="h-3 w-3" /> Nascimento
                </span>
                <span className="text-sm font-medium text-foreground">
                  {client.birth_date
                    ? format(parseDate(client.birth_date)!, "dd/MM/yyyy")
                    : "Não informada"}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Endereço
                </span>
                <span className="text-sm font-medium text-foreground">
                  {addressDisplay || "Não informado"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}