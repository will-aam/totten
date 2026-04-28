// components/services/package-edit-modal.tsx
"use client";

import React, { useState, useEffect, memo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  LoaderDots,
  Save,
  Power,
  Layers,
  CalendarDetail,
  Package,
  Dollar,
  Rename,
} from "@boxicons/react";
import {
  updatePackageTemplate,
  togglePackageTemplateStatus,
} from "@/app/actions/package-templates";
import { cn } from "@/lib/utils";

interface PackageEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageTemplate: any | null;
  onSuccess: () => void;
}

const noSpinClass =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export const PackageEditModal = memo(
  ({
    open,
    onOpenChange,
    packageTemplate,
    onSuccess,
  }: PackageEditModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      name: "",
      description: "",
      total_sessions: "",
      price: "",
      validity_days: "",
    });

    useEffect(() => {
      if (packageTemplate && open) {
        setFormData({
          name: packageTemplate.name || "",
          description: packageTemplate.description || "",
          total_sessions: packageTemplate.total_sessions?.toString() || "",
          price: packageTemplate.price?.toString() || "",
          validity_days: packageTemplate.validity_days?.toString() || "",
        });
      }
    }, [packageTemplate, open]);

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
          toast.success("Pacote atualizado!");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(res.error || "Erro ao atualizar.");
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
        toast.error("Erro ao mudar estado.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-4xl border-none shadow-2xl bg-background p-0 overflow-hidden">
          {/* HEADER */}
          <div className="p-6 pb-4 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Package size="sm" className="text-primary" />
                Editar Pacote
              </DialogTitle>
              <DialogDescription className="font-medium">
                Altere as configurações do pacote{" "}
                <span className="font-bold text-foreground">
                  {packageTemplate.name}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* BODY */}
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <Rename size="xs" /> Nome do Pacote
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Pacote Verão"
                className="rounded-2xl h-12 bg-muted/40 border-none font-bold focus-visible:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                  <Layers size="xs" /> Sessões
                </Label>
                <Input
                  type="number"
                  value={formData.total_sessions}
                  onChange={(e) =>
                    setFormData({ ...formData, total_sessions: e.target.value })
                  }
                  className={cn(
                    "rounded-2xl h-12 bg-muted/40 border-none font-bold focus-visible:ring-primary/20",
                    noSpinClass,
                  )}
                  placeholder="Ex: 10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                  <Dollar size="xs" /> Preço (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className={cn(
                    "rounded-2xl h-12 bg-muted/40 border-none font-bold focus-visible:ring-primary/20",
                    noSpinClass,
                  )}
                  placeholder="Ex: 150.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <CalendarDetail size="xs" /> Validade (dias)
              </Label>
              <Input
                type="number"
                placeholder="Deixe em branco para vitalício..."
                value={formData.validity_days}
                onChange={(e) =>
                  setFormData({ ...formData, validity_days: e.target.value })
                }
                className={cn(
                  "rounded-2xl h-12 bg-muted/40 border-none font-bold focus-visible:ring-primary/20",
                  noSpinClass,
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Descrição Interna
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="h-20 resize-none rounded-2xl bg-muted/40 border-none font-medium p-4 focus-visible:ring-primary/20"
                placeholder="Anotações sobre este pacote..."
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t border-border/40 flex flex-col-reverse sm:flex-row gap-3 bg-muted/10">
            <Button
              type="button"
              variant={packageTemplate.active ? "outline" : "secondary"}
              className={cn(
                "rounded-2xl h-12 font-bold w-full sm:w-auto",
                packageTemplate.active
                  ? "text-destructive border-destructive/20 hover:bg-destructive/10"
                  : "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20",
              )}
              onClick={handleToggleStatus}
              disabled={loading}
            >
              {loading ? (
                <LoaderDots size="sm" className="animate-spin" />
              ) : packageTemplate.active ? (
                <>
                  <Power size="sm" className="mr-2" /> Desativar Pacote
                </>
              ) : (
                <>
                  <Power size="sm" className="mr-2" /> Ativar Pacote
                </>
              )}
            </Button>

            <div className="flex-1" />

            <Button
              onClick={handleSave}
              disabled={loading}
              className="rounded-2xl h-12 px-8 font-black bg-primary text-primary-foreground w-full sm:w-auto"
            >
              {loading ? (
                <LoaderDots size="sm" className="animate-spin mr-2" />
              ) : (
                <Save size="sm" className="mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

PackageEditModal.displayName = "PackageEditModal";
