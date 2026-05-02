// components/client/client-header.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Check, X, LoaderDots } from "@boxicons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ClientHeaderType = {
  id: string;
  name: string;
  cpf: string;
};

function formatCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function ClientHeader({ client }: { client: ClientHeaderType }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState(client.name);
  const [editCpf, setEditCpf] = useState(client.cpf);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Foca no input de nome automaticamente ao entrar no modo de edição
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  const initial = client.name ? client.name.charAt(0).toUpperCase() : "?";

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error("O nome do cliente é obrigatório.");
      return;
    }

    const cleanCpf = editCpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      toast.error("O CPF deve conter exatamente 11 dígitos.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), cpf: editCpf }),
      });

      if (res.ok) {
        toast.success("Perfil atualizado com sucesso!");
        setIsEditing(false);
        mutate(`/api/clients/${client.id}`); // Atualiza o SWR globalmente
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar alterações.");
      }
    } catch {
      toast.error("Erro de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(client.name);
    setEditCpf(client.cpf);
  };

  // Atalhos de teclado premium (Enter salva, Esc cancela)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div className="flex items-center gap-4 md:gap-5 border-b border-border/40 pb-6 mb-2">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="rounded-full h-11 w-11 shrink-0 text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <Link href="/admin/clients">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
      </Button>

      <div className="flex items-center gap-4 w-full min-w-0">
        {/* Avatar Minimalista */}
        <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary font-medium text-2xl shadow-sm ring-1 ring-primary/10">
          {initial}
        </div>

        <div className="flex flex-col flex-1 min-w-0 justify-center">
          {isEditing ? (
            <div className="flex flex-col gap-1.5 w-full max-w-md animate-in fade-in slide-in-from-left-2 duration-300">
              <input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-b border-primary/30 focus:border-primary text-xl md:text-2xl font-semibold tracking-tight text-foreground outline-none transition-colors px-1 py-0.5 placeholder:text-muted-foreground/40"
                placeholder="Nome da cliente"
              />
              <input
                value={editCpf}
                onChange={(e) => setEditCpf(formatCpf(e.target.value))}
                onKeyDown={handleKeyDown}
                className="w-40 bg-transparent border-b border-primary/30 focus:border-primary text-sm text-muted-foreground outline-none transition-colors px-1 py-0.5 placeholder:text-muted-foreground/40 mt-1"
                placeholder="000.000.000-00"
              />
            </div>
          ) : (
            <div
              className="flex flex-col group cursor-pointer w-fit rounded-xl hover:bg-muted/30 transition-colors -ml-2 p-2"
              onClick={() => setIsEditing(true)}
              title="Clique para editar"
            >
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground/90 leading-none truncate">
                  {client.name}
                </h1>
                <Pencil
                  className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0"
                  strokeWidth={2}
                />
              </div>
              <span className="text-sm text-muted-foreground/70 leading-none mt-2">
                {client.cpf}
              </span>
            </div>
          )}
        </div>

        {/* Botões de Ação Suaves */}
        {isEditing && (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Cancelar (Esc)"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full h-10 w-10 transition-all shadow-sm border",
                saving
                  ? "bg-muted text-muted-foreground border-transparent"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200/50 hover:bg-emerald-100 hover:text-emerald-700",
              )}
              title="Salvar (Enter)"
            >
              {saving ? (
                <LoaderDots className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" strokeWidth={2} />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
