// app/(private)/admin/services/page.tsx
"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Plus } from "@boxicons/react";
import {
  Cog,
  Package,
  Tag,
  Clock,
  LoaderDots,
  Layers,
  CalendarDetail,
  TrendingDown,
  Box,
  Save,
  Image,
  Eye, EyeSlash
} from "@boxicons/react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { DurationManager } from "./_components/duration-manager";
import { ServiceEditModal } from "./_components/service-edit-modal";
import { CategoryEditModal } from "./_components/category-edit-modal";
import { PackageEditModal } from "./_components/package-edit-modal";
import { ResponsiveModal } from "../agenda/_components/responsive-modal";
import { NewServiceSheet } from "./_components/new-service-sheet";
import { NewPackageSheet } from "../packages/_components/new-package-sheet";
import { apiClient } from "@/lib/api-client";

import { getSelfServiceSettingsAction, updateSelfServiceSettingsAction } from "@/app/actions/settings";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "totem_catalog_show_inactive";

type ServiceStockItem = {
  id: string;
  stock_item_id: string;
  quantity_used: number;
  stock_item: {
    id: string;
    name: string;
    unit_cost: number;
  };
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  material_cost: number | null;
  track_stock: boolean;
  active: boolean;
  available_online: boolean;
  image_url: string | null;
  category_id: string;
  category: { id: string; name: string };
  stock_items?: ServiceStockItem[];
};

type PackageTemplate = {
  id: string;
  name: string;
  description: string | null;
  total_sessions: number;
  price: number;
  validity_days: number | null;
  active: boolean;
  available_online: boolean;
  image_url: string | null;
  service?: {
    name: string;
  };
};

type Category = {
  id: string;
  name: string;
  active: boolean;
  _count: { services: number };
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
}

const mobileNavItems = [
  { id: "services", label: "Serviços", icon: Cog },
  { id: "packages", label: "Pacotes", icon: Package },
  { id: "categories", label: "Categorias", icon: Tag },
  { id: "schedules", label: "Horários", icon: Clock },
];

function ServicesTabs() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "services";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [showInactive, setShowInactive] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setShowInactive(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(showInactive));
  }, [showInactive]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedPackage, setSelectedPackage] =
    useState<PackageTemplate | null>(null);

  // Nova Categoria
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [isNewServiceSheetOpen, setIsNewServiceSheetOpen] = useState(false);
  const [isNewPackageSheetOpen, setIsNewPackageSheetOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [validityMode, setValidityMode] = useState("ACQUISITION");
  const [savingSettings, setSavingSettings] = useState(false);

  const openSettings = async () => {
    setIsSettingsOpen(true);
    const res = await getSelfServiceSettingsAction();
    if (res.success && res.data) {
      setValidityMode(res.data.packageValidityMode || "ACQUISITION");
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const res = await updateSelfServiceSettingsAction({ packageValidityMode: validityMode } as any);
    if (res.success) {
      toast.success("Regra de validade atualizada!");
      setIsSettingsOpen(false);
    } else {
      toast.error("Erro ao salvar regra.");
    }
    setSavingSettings(false);
  };

  const {
    data: services,
    mutate: mutateServices,
    isLoading: loadingServices,
  } = useSWR<Service[]>("services", apiClient);
  const {
    data: packages,
    mutate: mutatePackages,
    isLoading: loadingPackages,
  } = useSWR<PackageTemplate[]>("package-templates", apiClient);
  const {
    data: categories,
    mutate: mutateCategories,
    isLoading: loadingCategories,
  } = useSWR<Category[]>("categories", apiClient);

  const visibleServices =
    services?.filter((s) => showInactive || s.active) || [];
  const visiblePackages =
    packages?.filter((p) => showInactive || p.active) || [];
  const visibleCategories =
    categories?.filter((c) => showInactive || c.active) || [];

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const data = await apiClient<{
        success: boolean;
        category: { name: string };
      }>("categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (data.success) {
        toast.success(`Categoria "${data.category.name}" criada!`);
        mutateCategories();
        setCreateCategoryOpen(false);
        setNewCategoryName("");
      } else {
        toast.error("Erro ao criar categoria");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro de conexão");
    } finally {
      setCreatingCategory(false);
    }
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="hidden md:grid w-full lg:w-150 grid-cols-4 h-auto gap-1 bg-muted p-1 rounded-full">
            <TabsTrigger
              value="services"
              className="flex items-center gap-2 py-2 rounded-full"
            >
              <Cog size="sm" /> Serviços
            </TabsTrigger>
            <TabsTrigger
              value="packages"
              className="flex items-center gap-2 py-2 rounded-full"
            >
              <Package size="sm" /> Pacotes
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="flex items-center gap-2 py-2 rounded-full"
            >
              <Tag size="sm" /> Categorias
            </TabsTrigger>
            <TabsTrigger
              value="schedules"
              className="flex items-center gap-2 py-2 rounded-full"
            >
              <Clock size="sm" /> Horários
            </TabsTrigger>
          </TabsList>

          {activeTab !== "schedules" && (
            <Button
              variant="outline"
              onClick={() => setShowInactive(!showInactive)}
              className="h-11 text-muted-foreground border-border/60 hover:bg-muted/50 transition-all w-full md:w-auto shadow-sm"
            >
              {showInactive ? (
                <>
                  <EyeSlash className="mr-2 h-4 w-4" /> Ocultar Inativos
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4 text-primary" /> Mostrar Inativos
                </>
              )}
            </Button>
          )}
        </div>

        {/* ABA: SERVIÇOS */}
        <TabsContent
          value="services"
          className="mt-0 outline-none flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Meus Serviços
              </h2>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Gerencie o catálogo de serviços do sistema.
              </p>
            </div>
            <Button
              className="h-12 px-8 font-medium shadow-sm"
              onClick={() => setIsNewServiceSheetOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Serviço
            </Button>
          </div>

          {loadingServices ? (
            <div className="flex justify-center py-12">
              <LoaderDots size="lg" className="text-muted-foreground" />
            </div>
          ) : services &&
            services.length > 0 &&
            visibleServices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 border border-dashed rounded-full">
              <p>Todos os seus serviços estão inativos.</p>
              <button
                onClick={() => setShowInactive(true)}
                className="text-primary hover:underline font-medium mt-2"
              >
                Mostrar serviços inativos
              </button>
            </div>
          ) : visibleServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 border border-dashed rounded-full">
              <img width="48" height="48" src="https://img.icons8.com/parakeet/48/question.png" alt="question" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Nenhum serviço cadastrado ainda.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={cn(
                    "group cursor-pointer flex flex-row overflow-hidden rounded-2xl border transition-all hover:border-primary/50 hover:shadow-md",
                    !service.active
                      ? "bg-muted/30 grayscale-[0.5] opacity-60 border-dashed"
                      : "bg-card shadow-sm border-border/50",
                  )}
                >
                  <div className="w-24 sm:w-28 shrink-0 relative bg-muted/30 border-r border-border/50">
                    {service.image_url ? (
                      <img src={service.image_url} alt={service.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 justify-between p-4 min-w-0">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <h3 className="font-semibold text-foreground leading-tight truncate">
                          {service.name}
                        </h3>
                        {!service.active && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-sm shrink-0">
                            Inativo
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className="w-fit text-[10px] bg-primary/5 text-primary hover:bg-primary/10"
                      >
                        {service.category.name}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-border/40 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Clock size="xs" />
                          {formatDuration(service.duration)}
                        </span>
                        <span className="text-sm font-black text-foreground">
                          {formatCurrency(Number(service.price))}
                        </span>
                      </div>

                      {service.track_stock ? (
                        <div className="flex items-center justify-between bg-blue-500/10 rounded-lg p-2 -mx-2 -mb-2 mt-1 border border-blue-500/20">
                          <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1.5">
                            <Box size="xs" />
                            Baixa Inteligente
                          </span>
                          <span className="text-[11px] font-bold text-blue-700">
                            {service.stock_items?.length || 0} Insumos
                          </span>
                        </div>
                      ) : service.material_cost &&
                        Number(service.material_cost) > 0 ? (
                        <div className="flex items-center justify-between bg-destructive/5 rounded-lg p-2 -mx-2 -mb-2 mt-1 border border-destructive/10">
                          <span className="text-[11px] font-medium text-destructive/80 flex items-center gap-1.5">
                            <TrendingDown size="xs" />
                            Custo Fixo
                          </span>
                          <span className="text-[11px] font-bold text-destructive/90">
                            {formatCurrency(Number(service.material_cost))}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA: PACOTES */}
        <TabsContent
          value="packages"
          className="mt-0 outline-none flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Planos e Pacotes
              </h2>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Modelos para vender múltiplas sessões.
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="ghost"
                className="h-12 w-12 rounded-full shrink-0 p-0 flex items-center justify-center hover:bg-muted/50"
                onClick={openSettings}
              >
                <Cog className="w-6 h-6 text-muted-foreground" />
              </Button>
              <Button
                className="h-12 px-8 font-medium shadow-sm"
                onClick={() => setIsNewPackageSheetOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Novo Pacote
              </Button>
            </div>
          </div>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Configurações de Pacote</DialogTitle>
                <DialogDescription>
                  A partir de que momento a data de expiração de um pacote deve começar a contar?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <RadioGroup value={validityMode} onValueChange={setValidityMode} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3 space-y-0 rounded-xl border p-4 cursor-pointer hover:bg-muted/50" onClick={() => setValidityMode("ACQUISITION")}>
                    <RadioGroupItem value="ACQUISITION" id="r1" />
                    <Label htmlFor="r1" className="cursor-pointer font-normal flex-1">A partir da data da compra do pacote</Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0 rounded-xl border p-4 cursor-pointer hover:bg-muted/50" onClick={() => setValidityMode("FIRST_BOOKING")}>
                    <RadioGroupItem value="FIRST_BOOKING" id="r2" />
                    <Label htmlFor="r2" className="cursor-pointer font-normal flex-1">A partir do primeiro agendamento marcado (ou consumido)</Label>
                  </div>
                </RadioGroup>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancelar</Button>
                <Button onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings && <LoaderDots className="mr-2 w-4 h-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {loadingPackages ? (
            <div className="flex justify-center py-12">
              <LoaderDots size="lg" className="text-muted-foreground" />
            </div>
          ) : packages &&
            packages.length > 0 &&
            visiblePackages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 border border-dashed rounded-full">
              <p>Todos os seus pacotes estão inativos.</p>
              <button
                onClick={() => setShowInactive(true)}
                className="text-primary hover:underline font-medium mt-2"
              >
                Mostrar pacotes inativos
              </button>
            </div>
          ) : visiblePackages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 border border-dashed rounded-full">
              <img width="48" height="48" src="https://img.icons8.com/parakeet/48/question.png" alt="question" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Nenhum pacote cadastrado.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visiblePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={cn(
                    "group cursor-pointer flex flex-row overflow-hidden rounded-2xl border transition-all hover:border-primary/50 hover:shadow-md",
                    !pkg.active
                      ? "bg-muted/30 grayscale-[0.5] opacity-60 border-dashed"
                      : "bg-card shadow-sm border-border/50",
                  )}
                >


                  <div className="flex flex-col flex-1 justify-between p-4 min-w-0">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <h3 className="font-semibold text-foreground leading-tight truncate">
                          {pkg.name}
                        </h3>
                        {!pkg.active && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-sm shrink-0">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                        <Cog size="xs" className="shrink-0" />
                        <span className="text-xs font-medium truncate">
                          {pkg.service?.name || "Sem serviço base"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-border/40 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Layers size="xs" />
                          {pkg.total_sessions} sessões
                        </span>
                        <span className="text-sm font-black text-foreground">
                          {formatCurrency(Number(pkg.price))}
                        </span>
                      </div>

                      {pkg.validity_days && Number(pkg.validity_days) > 0 ? (
                        <div className="flex items-center justify-between bg-primary/5 rounded-lg p-2 -mx-2 -mb-2 mt-1 border border-primary/10">
                          <span className="text-[11px] font-medium text-primary flex items-center gap-1.5">
                            <CalendarDetail size="xs" />
                            Validade
                          </span>
                          <span className="text-[11px] font-bold text-primary">
                            {pkg.validity_days} dias
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA: CATEGORIAS */}
        <TabsContent
          value="categories"
          className="mt-0 outline-none flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Categorias
              </h2>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Agrupe seus serviços para facilitar a busca.
              </p>
            </div>
            <Button
              className="h-12 px-8 font-medium shadow-sm"
              onClick={() => setCreateCategoryOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Categoria
            </Button>
          </div>

          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <LoaderDots size="lg" className="text-muted-foreground" />
            </div>
          ) : categories &&
            categories.length > 0 &&
            visibleCategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 border border-dashed rounded-full">
              <p>Todas as categorias estão inativas.</p>
              <button
                onClick={() => setShowInactive(true)}
                className="text-primary hover:underline font-medium mt-2"
              >
                Mostrar categorias inativas
              </button>
            </div>
          ) : visibleCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 border border-dashed rounded-full">
              <img width="48" height="48" src="https://img.icons8.com/parakeet/48/question.png" alt="question" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Nenhuma categoria cadastrada.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "flex items-center p-4 rounded-full border cursor-pointer transition-all hover:scale-[1.02]",
                    !category.active
                      ? "bg-muted/30 border-dashed opacity-60"
                      : "bg-card hover:border-primary/40 shadow-sm",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center shrink-0 border",
                        category.active
                          ? "bg-primary/5 text-primary border-primary/10"
                          : "bg-muted text-muted-foreground border-transparent",
                      )}
                    >
                      <Tag size="sm" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-semibold leading-tight text-foreground flex items-center gap-2">
                        {category.name}
                        {!category.active && (
                          <span className="text-[9px] font-bold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                            Inativa
                          </span>
                        )}
                      </h3>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {category._count.services} serviços vinculados
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA: HORÁRIOS */}
        <TabsContent value="schedules" className="mt-0 outline-none">
          <DurationManager />
        </TabsContent>
      </Tabs>

      <ServiceEditModal
        open={!!selectedService}
        onOpenChange={(open) => !open && setSelectedService(null)}
        service={selectedService}
        categories={categories || []}
        onSuccess={() => {
          mutateServices();
          mutatePackages();
        }}
      />
      {/* MODAL EDITAR PACOTE */}
      <PackageEditModal
        open={!!selectedPackage}
        onOpenChange={(open) => !open && setSelectedPackage(null)}
        packageTemplate={selectedPackage}
        onSuccess={() => {
          mutatePackages();
          mutateServices();
        }}
      />

      <NewServiceSheet
        isOpen={isNewServiceSheetOpen}
        onClose={() => setIsNewServiceSheetOpen(false)}
        onSuccess={() => {
          mutateServices();
          setIsNewServiceSheetOpen(false);
        }}
      />

      <NewPackageSheet
        isOpen={isNewPackageSheetOpen}
        onClose={() => setIsNewPackageSheetOpen(false)}
        onSuccess={() => {
          mutatePackages();
          setIsNewPackageSheetOpen(false);
        }}
      />

      <CategoryEditModal
        open={!!selectedCategory}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
        category={selectedCategory}
        onSuccess={() => {
          mutateCategories();
          mutateServices();
        }}
      />

      {/* Modal: Nova Categoria */}
      <Dialog
        open={createCategoryOpen}
        onOpenChange={(open: boolean) => {
          setCreateCategoryOpen(open);
          if (!open) setNewCategoryName("");
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="px-1">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-cat-name" className="text-sm font-medium">
                Nome da Categoria
              </Label>
              <Input
                id="new-cat-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                placeholder="Ex: Massagens, Estética, Terapias..."
                className=""
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCreateCategoryOpen(false);
                setNewCategoryName("");
              }}
              className=""
            >
              Cancelar
            </Button>
            <div className="flex-1" />
            <Button
              onClick={handleCreateCategory}
              disabled={creatingCategory || !newCategoryName.trim()}
              className="bg-primary hover:bg-primary/90 font-bold"
            >
              {creatingCategory ? (
                <LoaderDots size="sm" className="animate-spin" />
              ) : (
                <>
                  <Save size="sm" className="mr-2" /> Criar
                </>
              )}
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      <MobileBottomNav
        items={mobileNavItems}
        activeId={activeTab}
        onChange={setActiveTab}
      />
    </>
  );
}

export default function ServicesCatalogPage() {
  return (
    <>
      <AdminHeader title="Catálogo e Configurações" />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-32 md:pb-6 relative">
        <Suspense
          fallback={
            <div className="flex justify-center p-12 text-muted-foreground">
              <LoaderDots size="lg" />
            </div>
          }
        >
          <ServicesTabs />
        </Suspense>
      </div>
    </>
  );
}
