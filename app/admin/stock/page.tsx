"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  PackageOpen,
  ArrowUp,
  ListFilter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/admin-header";
import { cn } from "@/lib/utils";
import { NewStockItemModal } from "@/components/stock/new-item-modal";
import { StockTable, StockItem } from "@/components/stock/stock-table";
import { StockMobileItem } from "@/components/stock/stock-mobile-item";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 🔥 Importando as Server Actions reais
import {
  getStockItems,
  createStockItem,
  updateStockItem,
} from "@/app/actions/stock";

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof StockItem | "total">("name");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Buscar os dados ao carregar a página
  const fetchItems = async () => {
    setIsLoading(true);
    const res = await getStockItems();
    if (res.success && res.data) {
      setItems(res.data);
    } else {
      toast.error(res.error || "Erro ao carregar estoque.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Controle do Scroll
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Atualizar item (Edição Inline com Optimistic UI)
  const handleUpdateItem = async (id: string, updates: Partial<StockItem>) => {
    // Atualiza visualmente primeiro (sensação de instantâneo)
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );

    // Manda para o banco em background
    const res = await updateStockItem(id, updates);
    if (!res.success) {
      toast.error(res.error || "Erro ao atualizar insumo.");
      fetchItems(); // Se der erro, busca os dados reais novamente para reverter a tela
    } else {
      toast.success("Estoque atualizado com sucesso!");
    }
  };

  // 3. Salvar novo item
  const handleSaveNewItem = async (newItemData: any) => {
    const res = await createStockItem(newItemData);
    if (res.success) {
      toast.success("Insumo cadastrado com sucesso!");
      fetchItems(); // Recarrega a lista com o ID real do banco
    } else {
      toast.error(res.error || "Erro ao cadastrar insumo.");
    }
  };

  // Lógica de filtro e ordenação manual para o Mobile
  const filteredAndSortedItems = items
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "total") {
        return b.unit_cost * b.quantity - a.unit_cost * a.quantity;
      }
      if (typeof a[sortBy] === "string") {
        return (a[sortBy] as string).localeCompare(b[sortBy] as string);
      }
      return (b[sortBy] as number) - (a[sortBy] as number);
    });

  return (
    <>
      <AdminHeader title="Estoque" />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-350 mx-auto w-full pb-24 md:pb-6 relative">
        {/* Barra de Busca e Botões */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card pl-10 pr-4 py-2 text-sm text-foreground rounded-full md:rounded-md shadow-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden rounded-full shrink-0 border-border"
                >
                  <ListFilter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Nome
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("unit_cost")}>
                  Maior Custo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("quantity")}>
                  Maior Quantidade
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("total")}>
                  Maior Valor Total
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="rounded-full md:rounded-md shadow-sm flex-1 sm:w-auto font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> Cadastrar
            </Button>
          </div>
        </div>

        {/* Título */}
        <div className="flex items-center gap-2">
          <PackageOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Gestão de Insumos
          </h2>
        </div>

        {/* Loading ou Conteúdo */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p>Carregando estoque...</p>
          </div>
        ) : (
          <>
            {/* Desktop: Tabela */}
            <div className="hidden md:block">
              <StockTable
                data={filteredAndSortedItems}
                onUpdateItem={handleUpdateItem}
              />
            </div>

            {/* Mobile: Lista de Cards */}
            <div className="flex flex-col md:hidden">
              {filteredAndSortedItems.map((item) => (
                <StockMobileItem
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdateItem}
                />
              ))}
              {filteredAndSortedItems.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhum item encontrado.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 z-50",
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none",
        )}
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
      </button>

      <NewStockItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewItem}
      />
    </>
  );
}
