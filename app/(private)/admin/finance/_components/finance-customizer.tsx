// app/(private)/admin/finance/_components/finance-customizer.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/components/ui/use-mobile";
import { Switch } from "@/components/ui/switch";
import { PencilDraw, Move } from "@boxicons/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type FinanceWidgetConfig = {
  id: string;
  name: string;
  visible: boolean;
};

export const DEFAULT_FINANCE_WIDGETS: FinanceWidgetConfig[] = [
  { id: "hero_chart", name: "Painel Consolidado de Receita", visible: true },
  { id: "comparison_chart", name: "Receitas vs Despesas (Mensal)", visible: true },
  { id: "top_services", name: "Curva ABC de Serviços", visible: true },
  { id: "ticket", name: "Ticket Médio", visible: true },
  { id: "payment_methods", name: "Meios de Pagamento", visible: false },
  { id: "recent_transactions", name: "Últimas Movimentações", visible: false },
];

function SortableItem({
  widget,
  onToggle,
  canDisable,
}: {
  widget: FinanceWidgetConfig;
  onToggle: (id: string, checked: boolean) => void;
  canDisable: boolean;
}) {
  const isFixed = widget.id === "ticket";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-lg shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <Move size="sm" />
        </div>
        <span className="text-sm font-medium text-foreground">{widget.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {isFixed && (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Fixo
          </span>
        )}
        <Switch
          checked={isFixed ? true : widget.visible}
          onCheckedChange={(checked) => !isFixed && onToggle(widget.id, checked)}
          disabled={isFixed || (widget.visible && !canDisable)}
        />
      </div>
    </div>
  );
}

export function FinanceCustomizer({
  widgets,
  onSave,
}: {
  widgets: FinanceWidgetConfig[];
  onSave: (w: FinanceWidgetConfig[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FinanceWidgetConfig[]>(
    widgets.length ? widgets : DEFAULT_FINANCE_WIDGETS,
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    if (widgets.length > 0) setItems(widgets);
  }, [widgets]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((i) => i.id === active.id);
        const newIndex = currentItems.findIndex((i) => i.id === over.id);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  }

  function handleToggle(id: string, checked: boolean) {
    if (id === "ticket") return; // Fixo no painel financeiro
    setItems((current) =>
      current.map((w) => (w.id === id ? { ...w, visible: checked } : w)),
    );
  }

  const visibleCount = items.filter((w) => w.visible).length;
  // Obrigatoriedade de manter pelo menos 3 gráficos visíveis conforme pedido do usuário
  const canDisable = visibleCount > 3;

  function handleSave() {
    onSave(items);
    setOpen(false);
  }

  const triggerButton = (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 rounded-xl border-border/50 bg-card hover:bg-muted/50 text-foreground shadow-sm"
    >
      <PencilDraw size="sm" />
      <span className="hidden sm:inline">Personalizar Dashboard</span>
    </Button>
  );

  const contentList = (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {items.map((widget) => (
            <SortableItem
              key={widget.id}
              widget={widget}
              onToggle={handleToggle}
              canDisable={canDisable}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="bg-background">
          <DrawerHeader className="text-left">
            <DrawerTitle>Personalizar Dashboard Financeiro</DrawerTitle>
            <DrawerDescription>
              Arraste para reordenar os gráficos. É obrigatório manter pelo menos 3 gráficos visíveis.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">{contentList}</div>
          <DrawerFooter className="pt-2">
            <Button onClick={handleSave} className="rounded-xl">
              Salvar Alterações
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="rounded-xl">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>

      <DialogContent className="sm:max-w-[440px] border-border/50 bg-card rounded-2xl">
        <DialogHeader>
          <DialogTitle>Personalizar Dashboard Financeiro</DialogTitle>
          <DialogDescription>
            Arraste para reordenar os gráficos. É obrigatório manter pelo menos 3 gráficos visíveis.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">{contentList}</div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} className="rounded-xl">
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
