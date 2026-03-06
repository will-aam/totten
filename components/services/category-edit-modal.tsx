"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Power, PowerOff } from "lucide-react";
import { updateCategory, toggleCategoryStatus } from "@/app/actions/services";

interface CategoryEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: any | null;
  onSuccess: () => void;
}

export function CategoryEditModal({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  // Sincroniza o campo de input quando o modal abre com uma categoria selecionada
  useEffect(() => {
    if (category) {
      setName(category.name || "");
    }
  }, [category]);

  if (!category) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("O nome da categoria é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateCategory(category.id, name);
      if (res.success) {
        toast.success("Categoria atualizada com sucesso!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Erro ao atualizar.");
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar categoria.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      // category.active vem do banco (true/false)
      const res = await toggleCategoryStatus(category.id, category.active);
      if (res.success) {
        toast.success(
          category.active ? "Categoria desativada!" : "Categoria ativada!",
        );
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error("Erro ao mudar o status.");
      }
    } catch (error) {
      toast.error("Erro ao processar alteração de status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Editar Categoria
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name" className="text-sm font-medium">
              Nome da Categoria
            </Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Massagens, Estética, Terapias..."
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4">
          {/* BOTÃO DE STATUS (Inutilizar em vez de Excluir) */}
          <Button
            type="button"
            variant="outline"
            className={
              category.active
                ? "text-destructive hover:bg-destructive/10 border-destructive/20 rounded-xl"
                : "text-emerald-600 hover:bg-emerald-50 border-emerald-200 rounded-xl"
            }
            onClick={handleToggleStatus}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : category.active ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" /> Desativar
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" /> Ativar
              </>
            )}
          </Button>

          <div className="flex-1" />

          <Button
            onClick={handleSave}
            disabled={loading}
            className="rounded-xl bg-primary hover:bg-primary/90 font-bold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
