"use client";

import { useState, useEffect } from "react";
import { Plus, Search, PackageOpen, ArrowUp, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/admin-header";
import { cn } from "@/lib/utils";
import { NewStockItemModal } from "@/components/stock/new-item-modal";
import { StockTable, StockItem } from "@/components/stock/stock-table";
import { StockMobileItem } from "@/components/stock/stock-mobile-item"; // 🔥 Novo Componente
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initialMockData: StockItem[] = [
  {
    id: "1",
    name: "Óleo de Massagem Tropical (500ml)",
    quantity: 2.5,
    unit_cost: 45.0,
    isAutoDeduct: false,
  },
  {
    id: "2",
    name: "Agulhas de Acupuntura (Caixa c/ 100)",
    quantity: 15,
    unit_cost: 30.0,
    isAutoDeduct: true,
  },
  {
    id: "3",
    name: "Creme Hidratante Corporal (500g)",
    quantity: 4,
    unit_cost: 65.5,
    isAutoDeduct: false,
  },
  {
    id: "4",
    name: "Lençol Descartável (Rolo)",
    quantity: 10,
    unit_cost: 25.0,
    isAutoDeduct: true,
  },
  {
    id: "5",
    name: "Algodão (Pacote 500g)",
    quantity: 3.2,
    unit_cost: 18.9,
    isAutoDeduct: false,
  },
];

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>(initialMockData);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof StockItem | "total">("name");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleUpdateItem = (id: string, updates: Partial<StockItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const handleSaveNewItem = (newItemData: any) => {
    setItems((prev) => [newItemData, ...prev]);
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
        {/* Barra de Busca e Botões - CORRIGIDO O OVERFLOW */}
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

          {/* Container de botões com w-full para não vazar */}
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
              {/* ... DropdownContent ... */}
            </DropdownMenu>

            <Button
              onClick={() => setIsModalOpen(true)}
              // 🔥 CORREÇÃO: flex-1 no mobile faz ele ocupar o espaço que sobra sem vazar
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

        {/* MÁGICA DA RESPONSIVIDADE */}
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
