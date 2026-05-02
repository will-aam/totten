"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
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
} from "@boxicons/react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { AdminHeader } from "@/components/admin-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { DurationManager } from "@/components/service-durations/duration-manager";
import { ServiceEditModal } from "@/components/services/service-edit-modal";
import { CategoryEditModal } from "@/components/services/category-edit-modal";
import { PackageEditModal } from "@/components/services/package-edit-modal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedPackage, setSelectedPackage] =
    useState<PackageTemplate | null>(null);

  const {
    data: services,
    mutate: mutateServices,
    isLoading: loadingServices,
  } = useSWR<Service[]>("/api/services", fetcher);
  const {
    data: packages,
    mutate: mutatePackages,
    isLoading: loadingPackages,
  } = useSWR<PackageTemplate[]>("/api/package-templates", fetcher);
  const {
    data: categories,
    mutate: mutateCategories,
    isLoading: loadingCategories,
  } = useSWR<Category[]>("/api/categories", fetcher);

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="hidden md:grid w-full lg:w-150 grid-cols-4 h-auto gap-1 bg-muted p-1 rounded-xl">
            <TabsTrigger
              value="services"
              className="flex items-center gap-2 py-2 rounded-lg"
            >
              <Cog size="sm" /> Serviços
            </TabsTrigger>
            <TabsTrigger
              value="packages"
              className="flex items-center gap-2 py-2 rounded-lg"
            >
              <Package size="sm" /> Pacotes
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="flex items-center gap-2 py-2 rounded-lg"
            >
              <Tag size="sm" /> Categorias
            </TabsTrigger>
            <TabsTrigger
              value="schedules"
              className="flex items-center gap-2 py-2 rounded-lg"
            >
              <Clock size="sm" /> Horários
            </TabsTrigger>
          </TabsList>
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
            <Button asChild className="rounded-full shadow-sm">
              <Link href="/admin/services/new">
                <Plus className="mr-2 h-4 w-4" /> Novo Serviço
              </Link>
            </Button>
          </div>

          {loadingServices ? (
            <div className="flex justify-center py-12">
              <LoaderDots size="lg" className="text-muted-foreground" />
            </div>
          ) : !services || services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
              Nenhum serviço cadastrado ainda.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={cn(
                    "group cursor-pointer flex flex-col justify-between gap-3 p-5 rounded-2xl border transition-all hover:border-primary/50 hover:shadow-md",
                    !service.active
                      ? "bg-muted/30 grayscale-[0.5] opacity-60 border-dashed"
                      : "bg-card shadow-sm border-border/50",
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground leading-tight">
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
            <Button asChild className="rounded-full shadow-sm">
              <Link href="/admin/packages/new">
                <Plus className="mr-2 h-4 w-4" /> Novo Pacote
              </Link>
            </Button>
          </div>

          {loadingPackages ? (
            <div className="flex justify-center py-12">
              <LoaderDots size="lg" className="text-muted-foreground" />
            </div>
          ) : !packages || packages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
              Nenhum pacote cadastrado.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {packages?.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={cn(
                    "group cursor-pointer flex flex-col justify-between gap-3 p-5 rounded-2xl border transition-all hover:border-primary/50 hover:shadow-md",
                    !pkg.active
                      ? "bg-muted/30 grayscale-[0.5] opacity-60 border-dashed"
                      : "bg-card shadow-sm border-border/50",
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground leading-tight">
                        {pkg.name}
                      </h3>
                      {!pkg.active && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-sm shrink-0">
                          Inativo
                        </span>
                      )}
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
          </div>

          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <LoaderDots size="lg" className="text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "flex items-center p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]",
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
        onSuccess={() => mutateServices()}
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
      <PackageEditModal
        open={!!selectedPackage}
        onOpenChange={(open) => !open && setSelectedPackage(null)}
        packageTemplate={selectedPackage}
        onSuccess={() => mutatePackages()}
      />

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
