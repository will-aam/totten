// components/client/client-contact.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { mutate } from "swr";
import { Card, CardContent } from "@/components/ui/card";
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
  Whatsapp,
  Pencil,
  LoaderDots,
  Pin,
  Envelope,
  User,
  Calendar,
  UserIdCard,
} from "@boxicons/react";
import { toast } from "sonner";
import { format } from "date-fns";

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

//  Máscaras
function formatCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

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
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Estados Unificados
  const [editName, setEditName] = useState(client.name || "");
  const [editCpf, setEditCpf] = useState(client.cpf || "");
  const [editPhone, setEditPhone] = useState(client.phone_whatsapp || "");
  const [editEmail, setEditEmail] = useState(client.email || "");
  const [editBirthDate, setEditBirthDate] = useState(
    initDateStr(client.birth_date),
  );
  const [editZipCode, setEditZipCode] = useState(client.zip_code || "");
  const [editCity, setEditCity] = useState(client.city || "");
  const [editStreet, setEditStreet] = useState(client.street || "");
  const [editNumber, setEditNumber] = useState(client.number || "");

  const initial = client.name ? client.name.charAt(0).toUpperCase() : "?";

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
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/settings/messages");
        if (res.ok) {
          const data = await res.json();
          setTemplates((prev) => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error("Erro ao carregar templates", e);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setEditName(client.name || "");
      setEditCpf(client.cpf || "");
      setEditPhone(client.phone_whatsapp || "");
      setEditEmail(client.email || "");
      setEditBirthDate(initDateStr(client.birth_date));
      setEditZipCode(client.zip_code || "");
      setEditCity(client.city || "");
      setEditStreet(client.street || "");
      setEditNumber(client.number || "");
    } else {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [client, isEditing]);

  const handleCancel = () => setIsEditing(false);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCep = formatCepInput(e.target.value);
    setEditZipCode(formattedCep);
    const pureCep = formattedCep.replace(/\D/g, "");
    if (pureCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${pureCep}/json/`);
        const data = await res.json();
        if (data.erro) return toast.error("CEP não encontrado.");
        if (data.logradouro) setEditStreet(data.logradouro);
        if (data.localidade) setEditCity(data.localidade);
        toast.success("Endereço preenchido automaticamente!");
      } catch {
        toast.error("Erro ao tentar buscar o CEP.");
      }
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return toast.error("O nome é obrigatório.");

    // Valida o CPF apenas se o usuário tiver digitado algo
    const cpfLimpo = editCpf.replace(/\D/g, "");
    if (cpfLimpo.length > 0 && cpfLimpo.length !== 11) {
      return toast.error("O CPF deve ter 11 dígitos.");
    }

    if (editPhone.replace(/\D/g, "").length < 10)
      return toast.error("WhatsApp inválido.");
    if (editEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail))
      return toast.error("E-mail inválido.");

    let formattedBirthDate = null;
    if (editBirthDate.length === 10) {
      const [day, month, year] = editBirthDate.split("/");
      formattedBirthDate = `${year}-${month}-${day}`;
      const d = new Date(`${formattedBirthDate}T12:00:00Z`);
      if (
        isNaN(d.getTime()) ||
        d.getFullYear() > new Date().getFullYear() ||
        d.getFullYear() < 1900
      ) {
        return toast.error("Data de nascimento inválida.");
      }
    } else if (editBirthDate.length > 0) {
      return toast.error("Data de nascimento incompleta.");
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          // Se estiver vazio, envia null para respeitar o banco de dados
          cpf: editCpf.trim() !== "" ? editCpf : null,
          phone_whatsapp: editPhone,
          email: editEmail || null,
          birth_date: formattedBirthDate,
          zip_code: editZipCode || null,
          city: editCity || null,
          street: editStreet || null,
          number: editNumber || null,
        }),
      });

      if (!res.ok)
        throw new Error((await res.json())?.error || "Erro ao salvar.");
      toast.success("Ficha atualizada com sucesso!");
      setIsEditing(false);
      mutate(`/api/clients/${client.id}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };
  const handleSendWhatsApp = (templateText: string) => {
    if (!client.phone_whatsapp) return toast.error("Cliente sem WhatsApp.");
    const rawPhone = client.phone_whatsapp.replace(/\D/g, "");
    const targetPhone =
      rawPhone.startsWith("55") || rawPhone.length >= 12
        ? rawPhone
        : `55${rawPhone}`;
    if (targetPhone.length < 12) return toast.error("WhatsApp inválido.");

    const message = templateText.replace(/{nome}/g, client.name.split(" ")[0]);
    window.open(
      `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const addressDisplay = [
    client.street
      ? `${client.street}${client.number ? `, ${client.number}` : ""}`
      : "",
    client.city,
    client.zip_code,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <Card className="md:col-span-2 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
      <CardContent className="px-0 pt-4 md:pt-6 md:px-6 flex flex-col">
        {isEditing ? (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* NOVO: Header de edição limpo com botões diretos e explícitos */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Editando Ficha
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4"
                >
                  {saving ? <LoaderDots className="animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </div>

            {/* GRID UNIFICADO DE EDIÇÃO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Nome Completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                  <Input
                    ref={nameInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome do cliente"
                    className="pl-9 h-10 bg-muted/30 focus-visible:ring-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  CPF
                </Label>
                <div className="relative">
                  <UserIdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={editCpf}
                    onChange={(e) => setEditCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="pl-9 h-10 bg-muted/30"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  WhatsApp *
                </Label>
                <div className="relative">
                  <Whatsapp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#25D366] pointer-events-none" />
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
                  <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="pl-9 h-10 bg-muted/30"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Nascimento
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  className="h-10 bg-muted/30"
                  maxLength={9}
                />
              </div>
            </div>

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
                  Rua
                </Label>
                <Input
                  value={editStreet}
                  onChange={(e) => setEditStreet(e.target.value)}
                  placeholder="Avenida Central"
                  className="h-10 bg-muted/30"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Nº
                </Label>
                <Input
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  placeholder="123"
                  className="h-10 bg-muted/30"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col animate-in fade-in duration-300">
            {/*  NOVO: CABEÇALHO LIMPO DO PERFIL DIRETAMENTE NO CARD CONTENT */}
            <div className="flex gap-4 w-full">
              {/* Avatar */}
              <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-black text-2xl">
                {initial}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col min-w-0">
                    <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-tight truncate">
                      {client.name}
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                      CPF: {client.cpf || "Não informado"}
                    </p>
                  </div>
                  {/* Botão de Editar super elegante à direita */}
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground bg-muted/30 rounded-full h-10 w-10 hover:bg-muted/60 hover:text-foreground transition-colors shrink-0"
                    title="Editar Ficha"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                </div>

                {/* Botão de WhatsApp acoplado à área superior */}
                <div className="mt-4 sm:mt-5 w-full sm:w-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto rounded-xl h-10 border-[#25D366]/30 bg-[#25D366]/5 text-[#25D366] hover:bg-[#25D366]/10 transition-colors font-semibold"
                      >
                        <Whatsapp className="mr-2 h-4 w-4" /> Enviar Mensagem
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-64 rounded-xl"
                    >
                      <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                        Modelos Rápidos
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleSendWhatsApp(templates.msgUpdate)}
                        className="cursor-pointer py-2.5"
                      >
                        <span className="font-medium text-sm">
                          Atualização (Check-in)
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSendWhatsApp(templates.msgWelcome)}
                        className="cursor-pointer py-2.5"
                      >
                        <span className="font-medium text-sm">
                          Boas-vindas (Novo)
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSendWhatsApp(templates.msgRenewal)}
                        className="cursor-pointer py-2.5"
                      >
                        <span className="font-medium text-sm">
                          Renovação de Pacote
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleSendWhatsApp(templates.msgReminder)
                        }
                        className="cursor-pointer py-2.5"
                      >
                        <span className="font-medium text-sm">
                          Lembrete de Agenda
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 my-5 md:my-6" />

            {/*  GRID DE CONTATOS (Informações Adicionais) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Whatsapp className="h-3.5 w-3.5" /> WhatsApp Pessoal
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {client.phone_whatsapp || "Não informado"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Envelope className="h-3.5 w-3.5" /> E-mail
                </span>
                <span className="text-sm font-semibold text-foreground truncate">
                  {client.email || "Não informado"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Nascimento
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {client.birth_date
                    ? format(parseDate(client.birth_date)!, "dd/MM/yyyy")
                    : "Não informada"}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Pin className="h-3.5 w-3.5" /> Endereço Residencial
                </span>
                <span className="text-sm font-semibold text-foreground leading-snug">
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
