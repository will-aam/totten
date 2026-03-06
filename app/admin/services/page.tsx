"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { DurationManager } from "@/components/service-durations/duration-manager";
import { cn } from "@/lib/utils"; // <-- IMPORTAÇÃO ADICIONADA AQUI
import {
  Plus,
  Cog,
  Package,
  FolderOpen,
  Tags,
  Clock,
  Loader2,
  Layers,
  Edit2,
} from "lucide-react";

// Importação dos Modais
import { ServiceEditModal } from "@/components/services/service-edit-modal";
import { CategoryEditModal } from "@/components/services/category-edit-modal";
import { PackageEditModal } from "@/components/services/package-edit-modal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// --- TIPOS ---
type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  active: boolean;
  category_id: string;
  category: { id: string; name: string };
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
  { id: "categories", label: "Categorias", icon: Tags },
  { id: "schedules", label: "Horários", icon: Clock },
];

function ServicesTabs() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "services";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Estados para controlar qual item está sendo editado nos Modais
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedPackage, setSelectedPackage] =
    useState<PackageTemplate | null>(null);

  // Busca de Dados com Mutate para atualização instantânea
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
          <TabsList className="hidden md:grid w-full lg:w-150 grid-cols-4 h-auto gap-1 bg-muted p-1">
            <TabsTrigger
              value="services"
              className="flex items-center gap-2 py-2"
            >
              <Cog className="h-4 w-4" /> Serviços
            </TabsTrigger>
            <TabsTrigger
              value="packages"
              className="flex items-center gap-2 py-2"
            >
              <Package className="h-4 w-4" /> Pacotes
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="flex items-center gap-2 py-2"
            >
              <Tags className="h-4 w-4" /> Categorias
            </TabsTrigger>
            <TabsTrigger
              value="schedules"
              className="flex items-center gap-2 py-2"
            >
              <Clock className="h-4 w-4" /> Horários
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === "services" && (
              <Button asChild className="rounded-full shadow-sm">
                <Link href="/admin/services/new">
                  <Plus className="mr-2 h-4 w-4" /> Novo Serviço
                </Link>
              </Button>
            )}
            {activeTab === "packages" && (
              <Button asChild className="rounded-full shadow-sm">
                <Link href="/admin/packages/new">
                  <Plus className="mr-2 h-4 w-4" /> Novo Pacote
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* LISTA DE SERVIÇOS */}
        <TabsContent value="services" className="mt-0 outline-none">
          <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
            <CardContent className="p-6">
              {loadingServices ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin" />
                </div>
              ) : !services || services.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum serviço encontrado.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={cn(
                        "group cursor-pointer flex flex-col gap-3 p-4 rounded-xl border transition-all hover:border-primary/50",
                        !service.active
                          ? "bg-muted/50 grayscale opacity-70"
                          : "bg-card shadow-sm",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">
                          {service.name} {!service.active && "(Inativo)"}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0"
                        >
                          {service.category.name}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(service.duration)}
                        </span>
                        <span className="text-sm font-bold">
                          {formatCurrency(Number(service.price))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LISTA DE PACOTES */}
        <TabsContent value="packages" className="mt-0 outline-none">
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages?.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={cn(
                    "group cursor-pointer flex flex-col gap-3 p-4 rounded-xl border transition-all hover:border-primary/50",
                    !pkg.active
                      ? "bg-muted/50 grayscale opacity-70"
                      : "bg-card shadow-sm",
                  )}
                >
                  <h3 className="font-semibold">
                    {pkg.name} {!pkg.active && "(Inativo)"}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {pkg.total_sessions}{" "}
                      sessões
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-sm font-bold">
                      {formatCurrency(Number(pkg.price))}
                    </span>
                    <Edit2 className="h-3 w-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </TabsContent>

        {/* LISTA DE CATEGORIAS */}
        <TabsContent value="categories" className="mt-0 outline-none">
          <CardContent className="p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                    !category.active
                      ? "bg-muted/50 opacity-60"
                      : "bg-card hover:bg-muted/30 shadow-sm",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        category.active ? "bg-primary/10" : "bg-muted",
                      )}
                    >
                      <Tags
                        className={cn(
                          "h-5 w-5",
                          category.active
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {category.name} {!category.active && "(Inativa)"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {category._count.services} serviços
                      </p>
                    </div>
                  </div>
                  <Edit2 className="h-4 w-4 opacity-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="schedules" className="mt-0 outline-none">
          <DurationManager />
        </TabsContent>
      </Tabs>

      {/* MODAIS DE EDIÇÃO INTEGRADOS */}
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
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full pb-32 md:pb-6 relative">
        <Suspense
          fallback={
            <div className="flex justify-center p-12 text-muted-foreground">
              Carregando catálogo...
            </div>
          }
        >
          <ServicesTabs />
        </Suspense>
      </div>
    </>
  );
}
