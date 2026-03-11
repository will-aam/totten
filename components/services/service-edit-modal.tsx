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
// import { Switch } from "@/components/ui/switch"; // TODO: Descomentar no futuro
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Power,
  PowerOff,
  // Palette,      // TODO: Descomentar no futuro
  // TrendingDown, // TODO: Descomentar no futuro
  // Globe,        // TODO: Descomentar no futuro
} from "lucide-react";
import { updateService, toggleServiceStatus } from "@/app/actions/services";

interface ServiceEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: any | null;
  categories: any[];
  onSuccess: () => void;
}

type Duration = {
  id: string;
  label: string;
  minutes: number;
};

export function ServiceEditModal({
  open,
  onOpenChange,
  service,
  categories,
  onSuccess,
}: ServiceEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [durations, setDurations] = useState<Duration[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category_id: "",
    // 🔥 TODO: Descomentar quando adicionar os campos no Prisma
    // color: "#D9C6BF",
    // cost: "",
    // isOnline: true,
  });

  useEffect(() => {
    if (open) {
      fetch("/api/service-durations")
        .then((res) => res.json())
        .then((data) => setDurations(data))
        .catch((err) => console.error("Erro ao buscar durações:", err));
    }
  }, [open]);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        price: service.price?.toString() || "",
        duration: service.duration?.toString() || "",
        category_id: service.category_id || "",
        // 🔥 TODO: Descomentar quando adicionar os campos no Prisma
        // color: service.color || "#D9C6BF",
        // cost: service.cost?.toString() || "",
        // isOnline: service.isOnline ?? true,
      });
    }
  }, [service]);

  if (!service) return null;

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.price ||
      !formData.duration ||
      !formData.category_id
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateService(service.id, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category_id: formData.category_id,
        // 🔥 TODO: Passar color, cost e isOnline para a action no futuro
      });

      if (res.success) {
        toast.success("Serviço atualizado com sucesso!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error("Erro ao salvar alterações.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const res = await toggleServiceStatus(service.id, service.active);
      if (res.success) {
        const msg = service.active ? "Serviço desativado" : "Serviço ativado";
        toast.success(msg);
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Erro ao alterar status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 flex flex-col max-h-[90vh] overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
          <DialogTitle className="text-lg">Editar Serviço</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Serviço *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-muted/50 h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, category_id: val })
                }
              >
                <SelectTrigger className="bg-muted/50 h-10">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              placeholder="Descreva os detalhes do serviço..."
            />
          </div>

          {/* Agrupamos Preço e Duração enquanto o Custo/Cor não entram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Preço de Venda (R$) *</Label>
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
                  className="bg-muted/50 h-10 pl-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duração Estimada *</Label>
              <Select
                value={formData.duration}
                onValueChange={(val) =>
                  setFormData({ ...formData, duration: val })
                }
              >
                <SelectTrigger className="bg-muted/50 h-10">
                  <SelectValue placeholder="Selecione o tempo" />
                </SelectTrigger>
                <SelectContent>
                  {durations.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhuma duração cadastrada
                    </SelectItem>
                  ) : (
                    durations.map((d) => (
                      <SelectItem key={d.id} value={d.minutes.toString()}>
                        {d.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 🔥 TODO: Bloco comentado dos futuros campos adicionais
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="cost" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" /> Custo (R$)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                  className="bg-muted/50 h-10 pl-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color" className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" /> Cor na Agenda
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border shadow-sm shrink-0">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="absolute -top-2 -left-2 h-14 w-14 cursor-pointer"
                  />
                </div>
                <span className="text-xs text-muted-foreground">Opcional</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex flex-col gap-1 pr-4">
              <Label className="flex items-center gap-2 text-foreground font-medium">
                <Globe className="h-4 w-4 text-primary" />
                Agendamento Online
              </Label>
              <p className="text-xs text-muted-foreground">
                Permite que os clientes agendem sozinhos.
              </p>
            </div>
            <Switch
              checked={formData.isOnline}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isOnline: checked })
              }
            />
          </div>
          */}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0 flex flex-col sm:flex-row gap-2 bg-card">
          <Button
            type="button"
            variant="outline"
            className={
              service.active
                ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                : "text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-700"
            }
            onClick={handleToggleStatus}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : service.active ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" /> Desativar
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" /> Ativar
              </>
            )}
          </Button>

          <div className="flex-1 hidden sm:block" />

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
