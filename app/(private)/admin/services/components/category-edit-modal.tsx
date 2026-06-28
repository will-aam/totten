// components/services/category-edit-modal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LoaderDots, Save, Power, AlertTriangle } from "@boxicons/react";
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

  const [confirmCascade, setConfirmCascade] = useState<{
    show: boolean;
    message: string;
    pendingAction: () => Promise<void>;
  }>({ show: false, message: "", pendingAction: async () => {} });

  useEffect(() => {
    if (category) {
      setName(category.name || "");
    }
  }, [category]);

  if (!category) return null;

  const hasLinkedServices = (category._count?.services ?? 0) > 0;
  const showDeactivateButton = !(category.active && hasLinkedServices);

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

  const handleToggleStatus = async (forceCascade: boolean = false) => {
    setLoading(true);
    try {
      const res = await toggleCategoryStatus(
        category.id,
        category.active,
        forceCascade,
      );

      if (res.requiresConfirmation) {
        setConfirmCascade({
          show: true,
          message: res.error || "Tem certeza que deseja inativar?",
          pendingAction: () => handleToggleStatus(true),
        });
        return;
      }

      if (res.success) {
        toast.success(
          category.active
            ? "Categoria e serviços desativados!"
            : "Categoria ativada!",
        );
        onSuccess();
        onOpenChange(false);
        setConfirmCascade({
          show: false,
          message: "",
          pendingAction: async () => {},
        });
      } else {
        toast.error(res.error || "Erro ao mudar o status.");
      }
    } catch (error) {
      toast.error("Erro ao processar alteração de status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            {showDeactivateButton && (
              <Button
                type="button"
                variant="outline"
                className={
                  category.active
                    ? "text-destructive hover:bg-destructive/10 border-destructive/20 rounded-xl"
                    : "text-emerald-600 hover:bg-emerald-50 border-emerald-200 rounded-xl"
                }
                onClick={() => handleToggleStatus(false)}
                disabled={loading}
              >
                {loading ? (
                  <LoaderDots size="sm" className="animate-spin" />
                ) : category.active ? (
                  <>
                    <Power size="sm" className="mr-2" /> Desativar
                  </>
                ) : (
                  <>
                    <Power size="sm" className="mr-2" /> Ativar
                  </>
                )}
              </Button>
            )}

            <div className="flex-1" />

            <Button
              onClick={handleSave}
              disabled={loading}
              className="rounded-xl bg-primary hover:bg-primary/90 font-bold"
            >
              {loading ? (
                <LoaderDots size="sm" className="animate-spin" />
              ) : (
                <>
                  <Save size="sm" className="mr-2" /> Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação para Cascata */}
      <Dialog
        open={confirmCascade.show}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmCascade({
              show: false,
              message: "",
              pendingAction: async () => {},
            });
            setLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Impacto em Serviços
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-foreground py-4 leading-relaxed">
              {confirmCascade.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmCascade({
                  show: false,
                  message: "",
                  pendingAction: async () => {},
                });
                setLoading(false);
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => await confirmCascade.pendingAction()}
              className="w-full sm:w-auto"
            >
              Inativar Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
