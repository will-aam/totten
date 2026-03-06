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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Power,
  PowerOff,
  Layers,
  CalendarDays,
} from "lucide-react";
import {
  updatePackageTemplate,
  togglePackageTemplateStatus,
} from "@/app/actions/package-templates";

interface PackageEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageTemplate: any | null;
  onSuccess: () => void;
}

export function PackageEditModal({
  open,
  onOpenChange,
  packageTemplate,
  onSuccess,
}: PackageEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    total_sessions: "",
    price: "",
    validity_days: "",
  });

  useEffect(() => {
    if (packageTemplate) {
      setFormData({
        name: packageTemplate.name || "",
        description: packageTemplate.description || "",
        total_sessions: packageTemplate.total_sessions?.toString() || "",
        price: packageTemplate.price?.toString() || "",
        validity_days: packageTemplate.validity_days?.toString() || "",
      });
    }
  }, [packageTemplate]);

  if (!packageTemplate) return null;

  const handleSave = async () => {
    if (!formData.name || !formData.total_sessions || !formData.price) {
      toast.error("Preencha os campos obrigatórios (Nome, Sessões e Preço).");
      return;
    }

    setLoading(true);
    try {
      const res = await updatePackageTemplate(packageTemplate.id, {
        name: formData.name,
        description: formData.description,
        total_sessions: parseInt(formData.total_sessions),
        price: parseFloat(formData.price),
        validity_days: formData.validity_days
          ? parseInt(formData.validity_days)
          : null,
      });

      if (res.success) {
        toast.success("Pacote atualizado com sucesso!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Erro ao guardar as alterações.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const res = await togglePackageTemplateStatus(
        packageTemplate.id,
        packageTemplate.active,
      );
      if (res.success) {
        toast.success(
          packageTemplate.active ? "Pacote desativado" : "Pacote ativado",
        );
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Erro ao alterar o estado do pacote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Editar Pacote</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pkg-name">Nome do Pacote</Label>
            <Input
              id="pkg-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pkg-sessions" className="flex items-center gap-2">
                <Layers className="h-3 w-3" /> Sessões
              </Label>
              <Input
                id="pkg-sessions"
                type="number"
                value={formData.total_sessions}
                onChange={(e) =>
                  setFormData({ ...formData, total_sessions: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pkg-price">Preço Total (R$)</Label>
              <Input
                id="pkg-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pkg-validity" className="flex items-center gap-2">
              <CalendarDays className="h-3 w-3" /> Validade (dias)
            </Label>
            <Input
              id="pkg-validity"
              type="number"
              placeholder="Opcional"
              value={formData.validity_days}
              onChange={(e) =>
                setFormData({ ...formData, validity_days: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pkg-desc">Descrição</Label>
            <Textarea
              id="pkg-desc"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className={
              packageTemplate.active ? "text-destructive" : "text-emerald-600"
            }
            onClick={handleToggleStatus}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : packageTemplate.active ? (
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

          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
