// components/history/history-table.tsx
"use client";

import { useState } from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash, LoaderDots, User, Cog } from "@boxicons/react"; // 🔥 Ícone Cog adicionado para o serviço
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { deleteCheckIn } from "@/app/actions/packages";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";

export interface EnrichedCheckIn {
  id: string;
  client_id: string;
  package_id: string;
  date_time: string;
  client_name: string;
  client_cpf: string;
  professional_name?: string | null;
  service_name?: string; // 🔥 RASTREABILIDADE: O nome da foto do Serviço vem aqui
}

// Atualizamos o Item Mobile para aceitar o clique de exclusão e exibir quem atendeu e o serviço prestado
function MobileHistoryItem({
  checkIn,
  onDelete,
}: {
  checkIn: EnrichedCheckIn;
  onDelete: (ci: EnrichedCheckIn) => void;
}) {
  const date = new Date(checkIn.date_time);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const initial = checkIn.client_name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between py-3 px-2 -mx-2 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shadow-sm border border-primary/20">
          {initial}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground leading-none mb-1">
            {checkIn.client_name}
          </span>
          {/* 🔥 Exibe o Serviço realizado no modo Mobile */}
          {checkIn.service_name && (
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mb-1.5 line-clamp-1">
              <Cog size="xs" /> {checkIn.service_name}
            </span>
          )}
          <div className="flex flex-col gap-1 text-[11px] text-muted-foreground capitalize">
            <span>
              {formattedDate} às {formattedTime}
            </span>
            {checkIn.professional_name && (
              <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <User size="xs" /> {checkIn.professional_name}
              </span>
            )}
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(checkIn)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function HistoryTable({
  data,
  onUpdate,
}: {
  data: EnrichedCheckIn[];
  onUpdate: () => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date_time", desc: true },
  ]);

  const [ciToDelete, setCiToDelete] = useState<EnrichedCheckIn | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!ciToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteCheckIn(ciToDelete.id);
      if (result.success) {
        toast.success("Check-in removido com sucesso.");
        onUpdate();
      } else {
        toast.error(result.error || "Erro ao remover check-in.");
      }
    } catch (error) {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setDeleting(false);
      setCiToDelete(null);
    }
  };

  const columns: ColumnDef<EnrichedCheckIn>[] = [
    {
      accessorKey: "client_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 hover:bg-muted hover:text-foreground text-muted-foreground font-semibold transition-colors rounded-full"
        >
          Cliente <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3 font-medium text-foreground px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
            {row.original.client_name.charAt(0).toUpperCase()}
          </div>
          <span className="truncate max-w-37.5 sm:max-w-none">
            {row.getValue("client_name")}
          </span>
        </div>
      ),
    },
    {
      // 🔥 NOVA COLUNA: Serviço/Pacote
      accessorKey: "service_name",
      header: () => (
        <span className="text-muted-foreground font-semibold px-2">
          Serviço
        </span>
      ),
      cell: ({ row }) => (
        <div className="px-2">
          <Badge
            variant="secondary"
            className="font-medium bg-muted text-muted-foreground hover:bg-muted/80 whitespace-nowrap"
          >
            {row.original.service_name || "---"}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "date_time",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 hover:bg-muted hover:text-foreground text-muted-foreground font-semibold transition-colors rounded-full"
        >
          Data e Hora <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("date_time"));
        const formattedDate = date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const formattedTime = date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const professionalName = row.original.professional_name;

        return (
          <div className="flex flex-col px-2">
            <span className="font-medium text-foreground capitalize whitespace-nowrap">
              {formattedDate}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">
              <span>{formattedTime}</span>
              {professionalName && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <User size="xs" /> {professionalName}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <div className="text-right px-4 text-muted-foreground font-semibold">
          Ação
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCiToDelete(row.original)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
    state: { sorting },
  });

  return (
    <div className="space-y-4">
      {/* GRID MOBILE */}
      <div className="flex flex-col md:hidden">
        {table.getRowModel().rows.map((row) => (
          <MobileHistoryItem
            key={row.id}
            checkIn={row.original as EnrichedCheckIn}
            onDelete={setCiToDelete}
          />
        ))}
      </div>

      {/* TABELA DESKTOP */}
      <div className="hidden md:block rounded-md border border-border overflow-hidden bg-background">
        <div className="max-h-150 overflow-auto relative custom-scrollbar">
          <table className="w-full text-sm text-left">
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-0"
                >
                  {headerGroup.headers.map((header) => {
                    const customClass =
                      (header.column.columnDef.meta as any)?.className || "";
                    return (
                      <TableHead
                        key={header.id}
                        className={`sticky top-0 z-10 bg-muted/50 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-px before:bg-border whitespace-nowrap ${customClass}`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length
                ? table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/30 border-b-border transition-colors group"
                    >
                      {row.getVisibleCells().map((cell) => {
                        const customClass =
                          (cell.column.columnDef.meta as any)?.className || "";
                        return (
                          <TableCell key={cell.id} className={customClass}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {table.getPageCount() > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4 mt-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-full sm:w-auto rounded-full"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-full sm:w-auto rounded-full"
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* 🔥 MODAL DE CONFIRMAÇÃO */}
      <AlertDialog
        open={!!ciToDelete}
        onOpenChange={(open) => !open && setCiToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Check-in?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir o registro de presença de{" "}
              <strong className="text-foreground">
                {ciToDelete?.client_name}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleting ? (
                <>
                  <LoaderDots className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
