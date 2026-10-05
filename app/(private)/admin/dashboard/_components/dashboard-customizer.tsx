// app/(private)/admin/dashboard/_components/dashboard-customizer.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
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
import { Cog, Move } from "@boxicons/react";
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

export type WidgetConfig = {
  id: string;
  name: string;
  visible: boolean;
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "heatmap", name: "Mapa de Calor", visible: true },
  { id: "scheduling", name: "Link de Agendamento", visible: true },
  { id: "busiest_hours", name: "Horários Movimentados", visible: true },
  { id: "ticket", name: "Ticket Médio", visible: true },
  { id: "ranking", name: "Ranking de Clientes", visible: true },
  { id: "checkins", name: "Check-ins Recentes", visible: true },
];

function SortableItem({
  widget,
  onToggle,
  canDisable
}: {
  widget: WidgetConfig;
  onToggle: (id: string, checked: boolean) => void;
  canDisable: boolean;
}) {
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

      <Switch
        checked={widget.visible}
        onCheckedChange={(checked) => onToggle(widget.id, checked)}
        disabled={widget.visible && !canDisable}
      />
    </div>
  );
}

export function DashboardCustomizer({
  widgets,
  onSave
}: {
  widgets: WidgetConfig[];
  onSave: (w: WidgetConfig[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WidgetConfig[]>(widgets.length ? widgets : DEFAULT_WIDGETS);
  const isMobile = useIsMobile();

  // Sincroniza quando as props mudam
  useEffect(() => {
    if (widgets.length > 0) setItems(widgets);
  }, [widgets]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleToggle(id: string, checked: boolean) {
    setItems(current =>
      current.map(w => w.id === id ? { ...w, visible: checked } : w)
    );
  }

  const visibleCount = items.filter(w => w.visible).length;
  const canDisable = visibleCount > 1;

  function handleSave() {
    onSave(items);
    setOpen(false);
  }

  const triggerButton = (
    <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/50 bg-card hover:bg-muted/50 text-foreground shadow-sm">
      <Cog size="sm" />
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
        items={items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {items.map(widget => (
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
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>
        <DrawerContent className="bg-background">
          <DrawerHeader className="text-left">
            <DrawerTitle>Personalizar Dashboard</DrawerTitle>
            <DrawerDescription>
              Arraste para reordenar os gráficos. Você deve manter pelo menos 1 item visível.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {contentList}
          </div>
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
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] border-border/50 bg-card rounded-2xl">
        <DialogHeader>
          <DialogTitle>Personalizar Dashboard</DialogTitle>
          <DialogDescription>
            Arraste para reordenar os gráficos. Você deve manter pelo menos 1 item visível.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {contentList}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
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
