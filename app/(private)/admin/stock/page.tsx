// app/(private)/admin/stock/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Package,
  ChevronUp,
  Filter,
  LoaderDots,
  FolderDownArrow, // <-- Ícone atualizado conforme seu pedido
} from "@boxicons/react";
import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/admin-header";
import { cn } from "@/lib/utils";

// Importando as ações do estoque (Get, Create, Update, Delete)
import { NewStockItemModal } from "./components/new-item-modal";
import { StockTable, StockItem } from "./components/stock-table";
import { StockMobileItem } from "./components/stock-mobile-item";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  getStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
} from "@/app/actions/stock";

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof StockItem | "total">("name");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

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

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleUpdateItem = async (id: string, updates: Partial<StockItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );

    const res = await updateStockItem(id, updates);
    if (!res.success) {
      toast.error(res.error || "Erro ao atualizar insumo.");
      fetchItems();
    } else {
      toast.success("Estoque atualizado com sucesso!");
    }
  };

  const handleSaveNewItem = async (newItemData: any) => {
    const res = await createStockItem(newItemData);
    if (res.success) {
      toast.success("Insumo cadastrado com sucesso!");
      fetchItems();
    } else {
      toast.error(res.error || "Erro ao cadastrar insumo.");
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const id = itemToDelete;
    setItemToDelete(null);

    const previousItems = [...items];
    setItems(items.filter((item) => item.id !== id));

    const res = await deleteStockItem(id);
    if (res.success) {
      toast.success(res.message || "Ação realizada com sucesso!");
    } else {
      toast.error(res.error || "Erro ao excluir insumo.");
      setItems(previousItems);
    }
  };

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

  const handleExportExcel = () => {
    if (filteredAndSortedItems.length === 0) {
      toast.error("Não há itens para exportar.");
      return;
    }

    // Removi a coluna 'Unidade' para respeitar a interface StockItem
    const headers = ["Nome,Quantidade,Custo Unitário (R$),Custo Total (R$)"];

    const rows = filteredAndSortedItems.map((item) => {
      const totalCost = (item.quantity * item.unit_cost).toFixed(2);
      const unitCost = item.unit_cost.toFixed(2);
      // Sem o item.unit_measurement, o TypeScript vai parar de reclamar
      return `"${item.name}",${item.quantity},"${unitCost}","${totalCost}"`;
    });

    const csvContent = headers.concat(rows).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const dateStr = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    link.setAttribute("download", `Estoque_Totten_${dateStr}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Planilha baixada com sucesso!");
  };

  return (
    <>
      <AdminHeader title="Estoque" />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
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
                  <Filter className="h-4 w-4" />
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

            {/* Novo Botão de Exportar com o seu ícone */}
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="h-12 px-4 rounded-xl font-medium shadow-sm border-border"
            >
              <FolderDownArrow className="mr-2 h-4 w-4" /> Exportar
            </Button>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-12 px-8 rounded-xl font-medium shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" /> Cadastrar
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Gestão de Insumos
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <LoaderDots className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p>Carregando estoque...</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto rounded-md border border-border">
              <StockTable
                data={filteredAndSortedItems}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={(id) => setItemToDelete(id)}
              />
            </div>

            <div className="flex flex-col md:hidden">
              {filteredAndSortedItems.map((item) => (
                <StockMobileItem
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdateItem}
                  onDelete={(id) => setItemToDelete(id)}
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
        <ChevronUp removePadding className="h-5 w-5" />
      </button>

      <NewStockItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewItem}
      />

      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl border border-border/50 p-6 bg-background sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              Excluir Insumo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este insumo do seu estoque? Essa
              ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="rounded-2xl border-none bg-muted m-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold m-0"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
