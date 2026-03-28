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
import { ArrowUpDown, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type StockItem = {
  id: string;
  name: string;
  quantity: number;
  unit_cost: number;
  isAutoDeduct: boolean;
};

interface StockTableProps {
  data: StockItem[];
  onUpdateItem: (id: string, updates: Partial<StockItem>) => void;
}

const hideArrowsClass =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export function StockTable({ data, onUpdateItem }: StockTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const columns: ColumnDef<StockItem>[] = [
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
                className="h-8 py-0"
                defaultValue={item.name}
                onBlur={(e) => {
                  onUpdateItem(item.id, { name: e.target.value });
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
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
      accessorKey: "isAutoDeduct",
      header: () => (
        <div className="text-center font-semibold text-muted-foreground px-2">
          Tipo de Baixa
        </div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-center">
            <Select
              value={item.isAutoDeduct ? "auto" : "manual"}
              onValueChange={(val) =>
                onUpdateItem(item.id, { isAutoDeduct: val === "auto" })
              }
            >
              <SelectTrigger className="h-8 w-32 border-none bg-transparent hover:bg-muted focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
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
          Custo <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1 px-2">
            <span className="text-muted-foreground text-xs">R$</span>
            <Input
              type="number"
              className={cn(
                "h-8 w-24 border-transparent bg-transparent hover:border-border focus:bg-background transition-all",
                hideArrowsClass,
              )}
              defaultValue={item.unit_cost}
              // 🔥 CORREÇÃO SÊNIOR: onBlur em vez de onChange
              onBlur={(e) =>
                onUpdateItem(item.id, {
                  unit_cost: parseFloat(e.target.value) || 0,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
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
          className="hover:bg-muted font-semibold rounded-full px-2"
        >
          Qtd <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-center px-2">
            <Input
              type="number"
              step="0.1"
              className={cn(
                "h-8 w-20 text-center border-transparent bg-transparent hover:border-border focus:bg-background transition-all",
                item.isAutoDeduct && "opacity-50 pointer-events-none",
                hideArrowsClass,
              )}
              defaultValue={item.quantity}
              // 🔥 CORREÇÃO SÊNIOR: onBlur em vez de onChange
              onBlur={(e) =>
                onUpdateItem(item.id, {
                  quantity: parseFloat(e.target.value) || 0,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
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
        <PackageOpen className="h-10 w-10 text-muted-foreground/40" />
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
