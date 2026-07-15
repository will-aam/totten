// app/(private)/admin/services/_components/service-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Clock,
  Dollar,
  Tag,
  AlignLeft,
  Globe,
  Save,
  LoaderDots,
  Box,
  Trash,
} from "@boxicons/react";
import { toast } from "sonner";
import { CategorySelect } from "./category-select";
import { getStockItems } from "@/app/actions/stock";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

type Duration = {
  id: string;
  label: string;
  minutes: number;
};

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
  quantity_used: number | string;
};

export function ServiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingDurations, setLoadingDurations] = useState(true);

  const [durations, setDurations] = useState<Duration[]>([]);
  const [availableStockItems, setAvailableStockItems] = useState<StockItem[]>(
    [],
  );
  const [selectedStockItems, setSelectedStockItems] = useState<
    SelectedStockItem[]
  >([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    duration: "",
    color: "#D9C6BF",
    price: "",
    cost: "",
    trackStock: false,
    isOnline: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchDurations = async () => {
      try {
        const data = await apiClient<Duration[]>("service-durations");
        setDurations(data);
      } catch (error) {
        console.error("Erro ao buscar durações:", error);
      } finally {
        setLoadingDurations(false);
      }
    };

    const fetchStock = async () => {
      const res = await getStockItems();
      if (res.success && res.data) {
        setAvailableStockItems(res.data);
      }
    };

    fetchDurations();
    fetchStock();
  }, []);

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
    const cleanQty = qty.replace(/\D/g, "");
    const parsedQty = cleanQty === "" ? "" : parseInt(cleanQty, 10);

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
    (acc, item) => acc + (Number(item.quantity_used) || 0) * item.unit_cost,
    0,
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";
    if (!form.category) errs.category = "Selecione uma categoria";
    if (!form.duration) errs.duration = "Selecione a duração";
    if (!form.price || Number(form.price) <= 0)
      errs.price = "Preço deve ser maior que zero";
    if (!form.trackStock && form.cost && Number(form.cost) < 0)
      errs.cost = "O custo não pode ser negativo";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient<{ success: boolean }>("services", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          category_id: form.category,
          description: form.description || null,
          duration: Number(form.duration),
          price: Number(form.price),
          track_stock: form.trackStock,
          material_cost: form.trackStock
            ? null
            : form.cost
              ? Number(form.cost)
              : null,
          stock_items: form.trackStock
            ? selectedStockItems.map((i) => ({
                stock_item_id: i.stock_item_id,
                quantity_used: Number(i.quantity_used) || 1,
              }))
            : [],
        }),
      });

      if (data.success) {
        toast.success("Serviço cadastrado com sucesso!");
        router.push("/admin/services");
      } else {
        toast.error("Erro ao cadastrar serviço");
      }
    } catch (error: any) {
      console.error("Erro ao salvar serviço:", error);
      toast.error(error.message || "Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 mt-2">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 xl:gap-12 items-start">
        {/* COLUNA ESQUERDA: Informações do Serviço */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-border/50 pb-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlignLeft size="sm" className="text-primary" />
              Detalhes do Serviço
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure as informações básicas e de agendamento.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-foreground font-medium">
                Nome do Serviço *
              </Label>
              <Input
                id="name"
                placeholder="Ex: Massagem Relaxante"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-muted/30 border-border/50 h-11"
              />
              {errors.name && (
                <p className="text-xs font-medium text-destructive ml-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="category"
                className="flex items-center gap-2 text-foreground font-medium"
              >
                <Tag size="sm" className="text-muted-foreground" />
                Categoria *
              </Label>
              <CategorySelect
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
                error={errors.category}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="duration"
                className="flex items-center gap-2 text-foreground font-medium"
              >
                <Clock size="sm" className="text-muted-foreground" />
                Duração Estimada *
              </Label>
              {loadingDurations ? (
                <div className="h-11 bg-muted/50 rounded-md animate-pulse" />
              ) : durations.length === 0 ? (
                <div className="p-3 bg-muted/30 rounded-lg border border-dashed border-border flex items-center h-11">
                  <p className="text-xs text-muted-foreground">
                    Nenhuma duração.{" "}
                    <Link
                      href="/admin/services?tab=schedules"
                      className="text-primary hover:underline font-medium"
                    >
                      Cadastrar
                    </Link>
                  </p>
                </div>
              ) : (
                <Select
                  value={form.duration}
                  onValueChange={(v) => setForm({ ...form, duration: v })}
                >
                  <SelectTrigger className="bg-muted/30 border-border/50 h-11">
                    <SelectValue placeholder="Selecione o tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((duration) => (
                      <SelectItem
                        key={duration.id}
                        value={duration.minutes.toString()}
                      >
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.duration && (
                <p className="text-xs font-medium text-destructive ml-1">
                  {errors.duration}
                </p>
              )}
            </div>

            {/* Agendamento Online comprimido */}
            <div className="flex flex-col gap-2 justify-end pb-1">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40 opacity-70 pointer-events-none select-none">
                <div className="flex flex-col">
                  <Label className="flex items-center gap-1.5 text-foreground font-medium text-sm">
                    <Globe size="sm" className="text-muted-foreground" />
                    Agendamento Online
                  </Label>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-wide">
                    EM BREVE
                  </span>
                </div>
                <Switch checked={form.isOnline} disabled />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="description"
              className="text-foreground font-medium"
            >
              Descrição (Para o Cliente)
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva o que está incluso neste serviço. Isso aparecerá no agendamento online."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="bg-muted/30 border-border/50 min-h-25 resize-none"
            />
          </div>
        </div>

        {/* COLUNA DIREITA: Valores e Custos */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-border/50 pb-3">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Dollar size="sm" className="text-primary" />
              Valores e Custos
            </h3>
            <p className="text-sm text-muted-foreground">
              Defina o preço e integre com o estoque.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="price" className="text-foreground font-medium">
              Preço de Venda (R$) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                R$
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="bg-primary/5 border-primary/20 h-14 pl-9 font-bold text-xl text-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            {errors.price && (
              <p className="text-xs font-medium text-destructive ml-1">
                {errors.price}
              </p>
            )}
          </div>

          {/* MÓDULO HÍBRIDO DE CUSTO */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between border border-border/60 p-3.5 rounded-xl bg-card hover:border-primary/30 transition-colors shadow-sm">
              <div className="flex flex-col gap-1 pr-4">
                <Label className="flex items-center gap-2 text-foreground font-semibold cursor-pointer text-sm">
                  <Box
                    size="sm"
                    className={cn(
                      form.trackStock
                        ? "text-blue-600"
                        : "text-muted-foreground",
                    )}
                  />
                  Baixa Inteligente
                </Label>
                <p className="text-xs text-muted-foreground leading-tight">
                  Calcular custo via estoque.
                </p>
              </div>
              <Switch
                checked={form.trackStock}
                onCheckedChange={(checked) =>
                  setForm({ ...form, trackStock: checked })
                }
              />
            </div>

            {form.trackStock ? (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                <Select onValueChange={handleAddStockItem} value="">
                  <SelectTrigger className="bg-muted/30 border-border/50 h-11 text-sm">
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
                        Nenhum insumo cadastrado.
                      </div>
                    )}
                  </SelectContent>
                </Select>

                {selectedStockItems.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1">
                    {selectedStockItems.map((item) => (
                      <div
                        key={item.stock_item_id}
                        className="flex items-center gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/50"
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
                            type="text"
                            inputMode="numeric"
                            className="h-8 w-14 text-center text-xs p-1 bg-background"
                            value={item.quantity_used}
                            onChange={(e) =>
                              handleUpdateStockQty(
                                item.stock_item_id,
                                e.target.value,
                              )
                            }
                            onBlur={(e) => {
                              if (
                                !e.target.value ||
                                Number(e.target.value) <= 0
                              ) {
                                handleUpdateStockQty(item.stock_item_id, "1");
                              }
                            }}
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
                            <Trash size="xs" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/40 border-dashed">
                      <span className="text-sm font-medium text-muted-foreground">
                        Custo Total Calculado:
                      </span>
                      <span className="text-base font-bold text-blue-600">
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
              <div className="flex flex-col gap-2 animate-in fade-in">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    className="bg-muted/30 border-border/50 h-11 pl-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight px-1">
                  Digite manualmente o gasto médio para este serviço (Opcional).
                </p>
                {errors.cost && (
                  <p className="text-xs font-medium text-destructive ml-1">
                    {errors.cost}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RODAPÉ E BOTÕES DE AÇÃO */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/50 mt-4">
        <Button
          asChild
          variant="ghost"
          type="button"
          className="hidden sm:flex text-muted-foreground rounded-full md:rounded-xl px-6"
        >
          <Link href="/admin/services">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full sm:w-auto rounded-full md:rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] px-8 h-12"
        >
          {loading ? (
            <LoaderDots size="sm" className="animate-spin mr-2" />
          ) : (
            <Save size="sm" className="mr-2" />
          )}
          {loading ? "Salvando..." : "Salvar Serviço"}
        </Button>
      </div>
    </form>
  );
}
