"use client";

import { useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

// 🔥 Tipo substituído para não depender mais do arquivo mockado (lib/data)
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

  // Se o nome vier vazio por algum motivo, não quebra a tela
  const initial = client.name ? client.name.charAt(0).toUpperCase() : "?";

  const handleSave = async () => {
    // 🔥 VALIDAÇÕES RÍGIDAS AQUI
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
        toast.success("Perfil atualizado!");
        setIsEditing(false);
        mutate(`/api/clients/${client.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar.");
      }
    } catch {
      toast.error("Erro de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 md:gap-4 border-b border-border/50 pb-4 md:pb-6">
      <Button
        asChild
        variant="outline"
        size="icon"
        className="rounded-full h-10 w-10 shrink-0"
      >
        <Link href="/admin/clients">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
      </Button>

      <div className="flex items-center gap-3 w-full min-w-0">
        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shadow-sm border border-primary/20">
          {initial}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 font-bold text-lg px-2 bg-muted/50 border-primary/20 focus-visible:ring-primary/30"
                placeholder="Nome obrigatório"
                autoFocus
              />
              <Input
                value={editCpf}
                onChange={(e) => setEditCpf(formatCpf(e.target.value))}
                className="h-7 font-mono text-[10px] px-2 bg-muted/50 border-primary/20 w-32"
                placeholder="CPF obrigatório"
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <div
                className="flex items-center gap-2 group cursor-pointer w-fit pr-4"
                onClick={() => setIsEditing(true)}
              >
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight truncate">
                  {client.name}
                </h1>
                <Pencil className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </div>
              <span className="text-xs font-mono text-muted-foreground leading-none mt-1">
                CPF: {client.cpf}
              </span>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditName(client.name);
                setEditCpf(client.cpf);
              }}
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 text-[#25D366] hover:bg-[#25D366]/10"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" strokeWidth={3} />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
