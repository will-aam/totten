// app/(private)/admin/stock/_components/stock-table.tsx
"use client";

import { useState } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Package, Trash } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type StockItem = {
  id: string;
  name: string;
  quantity: number;
  unit_cost: number;
};

interface StockTableProps {
  data: StockItem[];
  onUpdateItem: (id: string, updates: Partial<StockItem>) => void;
  onDeleteItem: (id: string) => void;
}

//  NOVO: estado visual “editando/focado”
const editableInputClass =
  "border-transparent bg-transparent shadow-none " +
  "hover:border-border/70 hover:bg-muted/20 " +
  "focus-visible:border-sky-400/70 focus-visible:bg-background " +
  "focus-visible:ring-2 focus-visible:ring-sky-400/25 focus-visible:ring-offset-0 " +
  "transition-colors";

export function StockTable({
  data,
  onUpdateItem,
  onDeleteItem,
}: StockTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const columns: ColumnDef<StockItem>[] = [
    {
      accessorKey: "id",
      enableSorting: false,
      header: () => (
        <div className="font-semibold px-2 text-muted-foreground">Cód.</div>
      ),
      cell: ({ row }) => {
        const shortId = row.original.id.slice(-5).toUpperCase();
        return (
          <div className="px-2 flex items-center">
            <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted/50 border border-border/50 px-2 py-0.5 rounded-md">
              #{shortId}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-muted font-semibold rounded-full px-2"
        >
          Insumo <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const isEditing = editingId === `${item.id}-name`;

        return (
          <div
            className="flex items-center font-medium px-2 min-h-10"
            onDoubleClick={() => setEditingId(`${item.id}-name`)}
          >
            {isEditing ? (
              <Input
                autoFocus
                className={cn("h-8 py-0", editableInputClass)}
                defaultValue={item.name}
                onBlur={(e) => {
                  onUpdateItem(item.id, { name: e.target.value });
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
            ) : (
              <span className="cursor-text select-none truncate py-1">
                {item.name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "unit_cost",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-muted font-semibold rounded-full px-2"
        >
          Custo Unitário <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1 px-2">
            <span className="text-muted-foreground text-xs">R$</span>
            <Input
              type="text" //  Alterado para text
              inputMode="decimal" // Chama o teclado numérico no celular
              className={cn("h-8 w-24", editableInputClass)}
              defaultValue={item.unit_cost}
              onChange={(e) => {
                // Bloqueia letras em tempo real, permitindo só números, vírgula e ponto
                e.target.value = e.target.value.replace(/[^0-9.,]/g, "");
              }}
              onBlur={(e) => {
                // Ao perder o foco, formata o que foi digitado
                const val = e.target.value.replace(",", "."); // Aceita vírgula do padrão BR
                let parsed = parseFloat(val);

                // Se ficou vazio ou digitou algo inválido, volta para 0
                if (isNaN(parsed) || parsed < 0) parsed = 0;

                e.target.value = parsed.toString(); // Devolve o número limpo pra tela
                onUpdateItem(item.id, { unit_cost: parsed });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") e.currentTarget.blur();
              }}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-muted font-semibold rounded-full px-2 w-full justify-center"
        >
          Quantidade <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-center px-2">
            <Input
              type="text" //  Alterado para text
              inputMode="decimal"
              className={cn("h-8 w-24 text-center", editableInputClass)}
              defaultValue={item.quantity}
              onChange={(e) => {
                // Bloqueia letras em tempo real
                e.target.value = e.target.value.replace(/[^0-9.,]/g, "");
              }}
              onBlur={(e) => {
                const val = e.target.value.replace(",", ".");
                let parsed = parseFloat(val);

                if (isNaN(parsed) || parsed < 0) parsed = 0;

                e.target.value = parsed.toString();
                onUpdateItem(item.id, { quantity: parsed });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") e.currentTarget.blur();
              }}
            />
          </div>
        );
      },
    },
    {
      id: "total",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-muted font-semibold rounded-full px-2"
        >
          Total <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) => row.unit_cost * row.quantity,
      cell: ({ row }) => {
        const total = row.original.unit_cost * row.original.quantity;
        return (
          <span className="font-bold px-4 block text-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(total)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="w-10"></div>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-end px-2 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteItem(item.id)}
              className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border border-dashed border-border">
        <Package className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Nenhum insumo encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-2 text-muted-foreground font-semibold"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-muted/30 border-b border-border transition-colors group"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-1">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
