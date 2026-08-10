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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";
import { uploadImageAction } from "@/app/actions/upload-image";
import { Image as ImageIcon, Upload, Loader2, Link as LinkIcon, Globe } from "lucide-react";
import {
  LoaderDots,
  Save,
  Power,
  Layers,
  CalendarDetail,
  Package,
  Dollar,
  Rename,
  Cog,
  AlertTriangle,
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
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
      name: "",
      description: "",
      total_sessions: "",
      price: "",
      validity_days: "",
      available_online: true,
      image_url: "",
    });

    useEffect(() => {
      if (packageTemplate && open) {
        setFormData({
          name: packageTemplate.name || "",
          description: packageTemplate.description || "",
          total_sessions: packageTemplate.total_sessions?.toString() || "",
          price: packageTemplate.price?.toString() || "",
          validity_days: packageTemplate.validity_days?.toString() || "",
          available_online: packageTemplate.available_online ?? true,
          image_url: packageTemplate.image_url || "",
        });
      }
    }, [packageTemplate, open]);

    if (!packageTemplate) return null;

    const serviceName =
      packageTemplate.service?.name || "Serviço não identificado";

    // Variáveis para controlar a lógica de status
    const isServiceActive = packageTemplate.service?.active ?? true;
    const isPackageActive = packageTemplate.active;

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
          available_online: formData.available_online,
          image_url: formData.image_url || null,
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setIsUploading(true);
        try {
          const compressedBase64 = await compressImage(file, 800);
          const res = await uploadImageAction(compressedBase64, "services");
          if (res.success && res.url) {
            setFormData({ ...formData, image_url: res.url });
          } else {
            toast.error(res.error || "Erro ao fazer upload da imagem");
          }
        } catch (error) {
          console.error("Erro ao processar imagem:", error);
          toast.error("Erro inesperado ao processar imagem.");
        } finally {
          setIsUploading(false);
        }
      }
    };

    // Dentro do seu components/services/package-edit-modal.tsx

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
        } else {
          // 🔥 AQUI ESTÁ O AJUSTE:
          // Em vez de só toast, você pode disparar um modal de aviso ou um toast mais detalhado
          toast.error("Não foi possível realizar a alteração", {
            description: res.error, // Isso vai destacar a mensagem clara do validador
            duration: 6000,
          });
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

            {/* Exibição do Serviço Base (Somente Leitura) */}
            <div className="space-y-1.5 opacity-70 pointer-events-none select-none">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                <Cog size="xs" /> Serviço Base Vinculado
              </Label>
              <Input
                value={serviceName}
                disabled
                className="rounded-2xl h-12 bg-muted/40 border-none font-bold text-muted-foreground"
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

            <div className="flex flex-col gap-2 justify-end pb-1">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-background hover:bg-muted/30 transition-colors">
                <div className="flex flex-col">
                  <Label className="flex items-center gap-1.5 text-foreground font-medium text-sm cursor-pointer" onClick={() => setFormData({ ...formData, available_online: !formData.available_online })}>
                    <Globe size="sm" className="text-muted-foreground" />
                    Agendamento Online
                  </Label>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Mostrar este pacote no site
                  </span>
                </div>
                <Switch checked={formData.available_online} onCheckedChange={(checked) => setFormData({ ...formData, available_online: checked })} />
              </div>
            </div>
            
            <div className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-muted/10">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Imagem do Pacote (Opcional)
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">Adicione uma imagem representativa para exibir no site.</p>
              
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pkgImageUrl" className="text-xs text-muted-foreground">URL da Imagem (Opção 1)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pkgImageUrl"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="bg-background border-border/50 h-10 pl-9 focus-visible:ring-1"
                      placeholder="Cole o link da imagem aqui..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="pkgImageUpload" className="text-xs text-muted-foreground">Fazer Upload (Opção 2)</Label>
                  <div className="relative">
                    <Input
                      id="pkgImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="sr-only"
                    />
                    <Label
                      htmlFor="pkgImageUpload"
                      className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-md border border-border/50 bg-background hover:bg-muted/50 cursor-pointer transition-colors text-sm font-medium"
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                      {isUploading ? "Enviando..." : "Escolher arquivo do computador"}
                    </Label>
                  </div>
                </div>

                {formData.image_url && (
                  <div className="mt-2 w-32 aspect-video rounded-lg overflow-hidden border border-border/50 relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-6 border-t border-border/40 flex flex-col-reverse sm:flex-row gap-3 bg-muted/10">
            <div className="flex flex-col w-full sm:w-auto">
              {/* Aviso educacional se tentar ativar pacote com serviço inativo */}
              {!isPackageActive && !isServiceActive && (
                <p className="text-[11px] text-destructive font-bold mb-2 flex items-center gap-1">
                  <AlertTriangle size="xs" /> O serviço base está inativo.
                </p>
              )}

              <Button
                type="button"
                variant={isPackageActive ? "outline" : "secondary"}
                className={cn(
                  "rounded-2xl h-12 font-bold w-full",
                  isPackageActive
                    ? "text-destructive border-destructive/20 hover:bg-destructive/10"
                    : "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20",
                  // Desabilita visualmente se for ativar mas o serviço está inativo
                  !isPackageActive &&
                    !isServiceActive &&
                    "opacity-50 cursor-not-allowed",
                )}
                onClick={handleToggleStatus}
                disabled={loading || (!isPackageActive && !isServiceActive)}
              >
                {loading ? (
                  <LoaderDots size="sm" className="animate-spin" />
                ) : isPackageActive ? (
                  <>
                    <Power size="sm" className="mr-2" /> Desativar Pacote
                  </>
                ) : (
                  <>
                    <Power size="sm" className="mr-2" /> Ativar Pacote
                  </>
                )}
              </Button>
            </div>

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
