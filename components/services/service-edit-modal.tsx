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
import { Switch } from "@/components/ui/switch";
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
  TrendingDown,
  PackageOpen,
  Trash2,
} from "lucide-react";
import { updateService, toggleServiceStatus } from "@/app/actions/services";
import { getStockItems } from "@/app/actions/stock"; // 🔥 Busca o Estoque
import { cn } from "@/lib/utils";

interface ServiceEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: any | null; // O objeto que vem da página de catálogo
  categories: any[];
  onSuccess: () => void;
}

type Duration = {
  id: string;
  label: string;
  minutes: number;
};

// Tipagem base do Insumo que vem do banco
type StockItem = {
  id: string;
  name: string;
  quantity: number;
  unit_cost: number;
  isAutoDeduct: boolean;
};

type SelectedStockItem = {
  stock_item_id: string;
  name: string;
  unit_cost: number;
  quantity_used: number;
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
  const [availableStockItems, setAvailableStockItems] = useState<StockItem[]>(
    [],
  );
  const [selectedStockItems, setSelectedStockItems] = useState<
    SelectedStockItem[]
  >([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category_id: "",
    cost: "",
    trackStock: false, // 🔥 Flag de Baixa Inteligente
  });

  // Carrega as durações e o estoque ao abrir o modal
  useEffect(() => {
    if (open) {
      fetch("/api/service-durations")
        .then((res) => res.json())
        .then((data) => setDurations(data))
        .catch((err) => console.error("Erro ao buscar durações:", err));

      getStockItems().then((res) => {
        if (res.success && res.data) {
          setAvailableStockItems(res.data);
        }
      });
    }
  }, [open]);

  // Preenche os dados quando o serviço muda
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        price: service.price?.toString() || "",
        duration: service.duration?.toString() || "",
        category_id: service.category_id || "",
        cost: service.material_cost?.toString() || "",
        trackStock: service.track_stock || false,
      });

      // Mapeia os insumos que já vêm do banco (se a baixa inteligente estiver ativa)
      if (service.stock_items && service.stock_items.length > 0) {
        const mapped = service.stock_items.map((item: any) => ({
          stock_item_id: item.stock_item_id,
          name: item.stock_item.name,
          unit_cost: Number(item.stock_item.unit_cost),
          quantity_used: Number(item.quantity_used),
        }));
        setSelectedStockItems(mapped);
      } else {
        setSelectedStockItems([]);
      }
    }
  }, [service]);

  if (!service) return null;

  // 🔥 Funções do Estoque
  const handleAddStockItem = (id: string) => {
    if (selectedStockItems.find((i) => i.stock_item_id === id)) return;

    const item = availableStockItems.find((i) => i.id === id);
    if (!item) return;

    setSelectedStockItems((prev) => [
      ...prev,
      {
        stock_item_id: item.id,
        name: item.name,
        unit_cost: item.unit_cost,
        quantity_used: 1,
      },
    ]);
  };

  const handleUpdateStockQty = (id: string, qty: string) => {
    const parsedQty = parseFloat(qty) || 0;
    setSelectedStockItems((prev) =>
      prev.map((i) =>
        i.stock_item_id === id ? { ...i, quantity_used: parsedQty } : i,
      ),
    );
  };

  const handleRemoveStockItem = (id: string) => {
    setSelectedStockItems((prev) => prev.filter((i) => i.stock_item_id !== id));
  };

  const calculatedMaterialCost = selectedStockItems.reduce(
    (acc, item) => acc + item.quantity_used * item.unit_cost,
    0,
  );

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
      // 🔥 Chamada da Action atualizada com os dados do Estoque
      const res = await updateService(service.id, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category_id: formData.category_id,
        track_stock: formData.trackStock,
        material_cost: formData.trackStock
          ? null
          : formData.cost
            ? parseFloat(formData.cost)
            : null,
        stock_items: formData.trackStock
          ? selectedStockItems.map((i) => ({
              stock_item_id: i.stock_item_id,
              quantity_used: i.quantity_used,
            }))
          : [],
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
      <DialogContent className="sm:max-w-175 p-0 flex flex-col max-h-[90vh] overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
          <DialogTitle className="text-lg">Editar Serviço</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Informações Básicas */}
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

          {/* Agenda e Preço */}
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
                  className="bg-muted/50 h-10 pl-9 font-bold text-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
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

          <div className="h-px w-full bg-border/50 my-2" />

          {/* 🔥 Custo Financeiro Híbrido (O Estoque na Edição) */}
          <div className="flex flex-col gap-4 bg-muted/10 p-4 rounded-xl border border-border/50">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex flex-col gap-1 pr-4">
                <Label className="flex items-center gap-2 text-foreground font-medium cursor-pointer">
                  <PackageOpen
                    className={cn(
                      "h-4 w-4",
                      formData.trackStock
                        ? "text-blue-600"
                        : "text-muted-foreground",
                    )}
                  />
                  Baixa Inteligente (Estoque)
                </Label>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Calcular custo automático usando itens reais do estoque.
                </p>
              </div>
              <Switch
                checked={formData.trackStock}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, trackStock: checked })
                }
              />
            </div>

            {formData.trackStock ? (
              // 🟢 MODO INTELIGENTE (ESTOQUE)
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 pt-1">
                <Select onValueChange={handleAddStockItem} value="">
                  <SelectTrigger className="bg-muted/50 border-border/50 h-10 text-sm">
                    <SelectValue placeholder="Buscar insumo do estoque..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStockItems.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                        disabled={selectedStockItems.some(
                          (i) => i.stock_item_id === item.id,
                        )}
                      >
                        {item.name} - R$ {item.unit_cost.toFixed(2)} / un
                      </SelectItem>
                    ))}
                    {availableStockItems.length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        Nenhum insumo cadastrado no estoque geral.
                      </div>
                    )}
                  </SelectContent>
                </Select>

                {selectedStockItems.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1">
                    {selectedStockItems.map((item) => (
                      <div
                        key={item.stock_item_id}
                        className="flex items-center gap-2 bg-card p-2 rounded-md border border-border shadow-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            R$ {item.unit_cost.toFixed(2)} un.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 w-16 text-center text-xs p-1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                            value={item.quantity_used}
                            onChange={(e) =>
                              handleUpdateStockQty(
                                item.stock_item_id,
                                e.target.value,
                              )
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              handleRemoveStockItem(item.stock_item_id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border border-dashed">
                      <span className="text-xs font-medium text-muted-foreground">
                        Custo Total Calculado:
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(calculatedMaterialCost)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 🔴 MODO PREGUIÇOSO (CHUTE MANUAL)
              <div className="grid gap-2 animate-in fade-in pt-1">
                <Label htmlFor="cost" className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" /> Custo de
                  Material (R$)
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
                <p className="text-[11px] text-muted-foreground">
                  Gasto fixo médio com descartáveis, cremes, etc.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0 flex flex-col sm:flex-row gap-2 bg-card">
          <Button
            type="button"
            variant="outline"
            className={
              service.active
                ? "text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                : "text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-700 border-emerald-600/20"
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
