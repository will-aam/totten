"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Layout, List, Star } from "@boxicons/react";
import { cn } from "@/lib/utils";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ProServices({ data, onChange }: any) {
  const { data: dbPackages, isLoading } = useSWR("/api/package-templates", fetcher);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Briefcase className="h-5 w-5 text-primary" />
          Serviços, Pacotes e Categorias
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Os serviços e pacotes ativos do seu sistema são puxados automaticamente para o site.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5 border border-border/50 rounded-xl bg-muted/10">
        <Label className="text-foreground font-medium text-base mb-1">Configuração de Exibição</Label>
        <p className="text-sm text-muted-foreground mb-2">Escolha quais módulos mostrar e o seu formato visual.</p>

        {/* SERVIÇOS AVULSOS */}
        <div className="flex flex-col py-4 border-b border-border/50 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">Serviços Avulsos</span>
              <span className="text-xs text-muted-foreground">Exibe seus procedimentos cadastrados.</span>
            </div>
            <button
              onClick={() => onChange({ ...data, showServices: data.showServices !== false ? false : true })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative shadow-inner",
                data.showServices !== false ? "bg-foreground" : "bg-muted-foreground/30"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-md",
                data.showServices !== false ? "left-6" : "left-0.5"
              )} />
            </button>
          </div>

          {data.showServices !== false && (
            <div className="flex flex-col gap-4 mt-2 p-4 bg-background rounded-lg border border-border/50">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">1. Texto Acima do Título (Overline)</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="Nossos Serviços"
                  value={data.servicesOverline || ""}
                  onChange={(e) => onChange({ ...data, servicesOverline: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">2. Título Principal</Label>
                <Input
                  className="h-8 text-sm font-semibold"
                  placeholder="Terapias para cada momento"
                  value={data.servicesTitle || ""}
                  onChange={(e) => onChange({ ...data, servicesTitle: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">3. Subtítulo</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="Escolha a experiência que melhor se adapta ao que você precisa hoje."
                  value={data.servicesSubtitle || ""}
                  onChange={(e) => onChange({ ...data, servicesSubtitle: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* PACOTES */}
        <div className="flex flex-col py-4 border-b border-border/50 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">Pacotes Promocionais</span>
              <span className="text-xs text-muted-foreground">Exibe os templates de pacotes fechados.</span>
            </div>
            <button
              onClick={() => onChange({ ...data, showPackages: data.showPackages !== false ? false : true })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative shadow-inner",
                data.showPackages !== false ? "bg-foreground" : "bg-muted-foreground/30"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-md",
                data.showPackages !== false ? "left-6" : "left-0.5"
              )} />
            </button>
          </div>

          {data.showPackages !== false && (
            <div className="flex flex-col gap-4 mt-2 p-4 bg-background rounded-lg border border-border/50">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">1. Subtítulo dos Pacotes</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="Planos flexíveis para quem quer incluir o autocuidado na rotina."
                  value={data.packagesSubtitle || ""}
                  onChange={(e) => onChange({ ...data, packagesSubtitle: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* PACOTE DESTAQUE */}
        {data.showPackages !== false && (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Pacote em Destaque ("Mais Popular")
              </Label>
              <span className="text-xs text-muted-foreground">Escolha qual pacote deseja destacar visualmente.</span>
            </div>
            <Select
              value={data.featuredPackageName || ""}
              onValueChange={(val) => onChange({ ...data, featuredPackageName: val })}
            >
              <SelectTrigger className="bg-background border-border/50 h-10">
                <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione um pacote..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum destaque</SelectItem>
                {dbPackages?.map((pkg: any) => (
                  <SelectItem key={pkg.id} value={pkg.name}>{pkg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
