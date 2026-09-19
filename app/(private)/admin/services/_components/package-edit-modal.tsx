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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";
import { uploadImageAction } from "@/app/actions/upload-image";
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
  Trash,
  Image,
  LoaderLines,
  Link,
  ArrowInUpSquareHalf
} from "@boxicons/react";
import {
  updatePackageTemplate,
  togglePackageTemplateStatus,
} from "@/app/actions/package-templates";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

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
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
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
          //  AQUI ESTÁ O AJUSTE:
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

    const handleDelete = async () => {
      setLoading(true);
      try {
        const res = (await apiClient(`package-templates/${packageTemplate.id}`, {
          method: "DELETE",
        })) as { success: boolean; error?: string };
        if (res.success) {
          toast.success("Pacote excluído com sucesso!");
          onSuccess();
          onOpenChange(false);
          setConfirmDelete(false);
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir pacote.");
      } finally {
        setLoading(false);
      }
    };

    const ModalContent = (
      <>
        <div className={cn("px-6 py-4 border-b border-border/50 shrink-0", isMobile ? "" : "")}>
          {isMobile ? (
            <SheetTitle className="text-lg font-semibold">Editar Pacote</SheetTitle>
          ) : (
            <DialogTitle className="text-lg font-semibold">Editar Pacote</DialogTitle>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Pacote *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-muted/50 h-10"
              />
            </div>

            <div className="grid gap-2 opacity-70 pointer-events-none select-none">
              <Label htmlFor="service">Serviço Base Vinculado</Label>
              <Input
                id="service"
                value={serviceName}
                disabled
                className="bg-muted/50 h-10 text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="h-20 resize-none bg-muted/50"
              placeholder="Descreva os detalhes do pacote..."
            />
          </div>

          <div className="flex flex-col gap-2 justify-end pb-1">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-background hover:bg-muted/30 transition-colors">
              <div className="flex flex-col">
                <Label className="flex items-center gap-1.5 text-foreground font-medium text-sm cursor-pointer" onClick={() => setFormData({ ...formData, available_online: !formData.available_online })}>
                  Agendamento Online
                </Label>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Mostrar este pacote no site
                </span>
              </div>
              <Switch checked={formData.available_online} onCheckedChange={(checked) => setFormData({ ...formData, available_online: checked })} />
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 border border-border/50 rounded-2xl bg-muted/10">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              Imagem do Pacote (Opcional)
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">Adicione uma imagem representativa para exibir no site.</p>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="pkgImageUrl" className="text-xs text-muted-foreground">URL da Imagem (Opção 1)</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    {isUploading ? <LoaderLines className="h-4 w-4 animate-spin text-muted-foreground" /> : <ArrowInUpSquareHalf className="h-4 w-4 text-muted-foreground" />}
                    {isUploading ? "Enviando..." : "Escolher arquivo"}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Preço do Pacote (R$) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="bg-muted/50 h-10 pl-9 font-bold text-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sessions">Sessões *</Label>
              <Input
                id="sessions"
                type="number"
                value={formData.total_sessions}
                onChange={(e) =>
                  setFormData({ ...formData, total_sessions: e.target.value })
                }
                className="bg-muted/50 h-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="validity" className="flex items-center justify-between">
              <span>Validade (dias)</span>
              <span className="text-[10px] text-muted-foreground">
                Máx: 365 dias
              </span>
            </Label>
            <Input
              id="validity"
              type="text"
              inputMode="numeric"
              placeholder="Deixe em branco para vitalício..."
              value={formData.validity_days}
              onChange={(e) => {
                let cleanDigit = e.target.value.replace(/\D/g, "");
                // Impede zero (se não digitou nada, deixa vazio)
                if (cleanDigit && Number(cleanDigit) === 0) cleanDigit = "";
                // Trava no limite
                if (Number(cleanDigit) > 365) cleanDigit = "365";
                setFormData({ ...formData, validity_days: cleanDigit });
              }}
              className="bg-muted/50 h-10"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/50 shrink-0 flex flex-col sm:flex-row gap-2 bg-card">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 shrink-0 px-3"
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
            >
              <Trash size="sm" />
            </Button>

            <Button
              type="button"
              variant="outline"
              className={cn("flex-1 sm:flex-none",
                isPackageActive
                  ? "text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  : "text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-700 border-emerald-600/20",
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
                  <Power size="sm" className="mr-2" /> Desativar
                </>
              ) : (
                <>
                  <Power size="sm" className="mr-2" /> Ativar
                </>
              )}
            </Button>
          </div>

          <div className="flex-1 hidden sm:block" />

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <LoaderDots size="sm" className="animate-spin mr-2" />
            ) : (
              <Save size="sm" className="mr-2" />
            )}
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </>
    );

    return (
      <>
        {isMobile ? (
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="p-0 flex flex-col max-h-[90dvh] overflow-hidden gap-0 rounded-t-[32px] border-t-0 shadow-2xl">
              {ModalContent}
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-175 p-0 flex flex-col max-h-[90vh] overflow-hidden gap-0">
              {ModalContent}
            </DialogContent>
          </Dialog>
        )}

        {/*  Modal de Confirmação de Exclusão */}
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent className="sm:max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash className="h-5 w-5" />
                Excluir Pacote
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-foreground py-4 leading-relaxed">
                Tem certeza que deseja excluir este pacote? Esta ação não poderá ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? <LoaderDots className="h-4 w-4 animate-spin" /> : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

PackageEditModal.displayName = "PackageEditModal";
