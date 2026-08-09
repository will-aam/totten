"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Briefcase, Layout, List, Star } from "@boxicons/react";
import { cn } from "@/lib/utils";

export function ProServices({ data, onChange }: any) {
  const servicesDisplay = data.servicesDisplay || "cards";
  const packagesDisplay = data.packagesDisplay || "cards";

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
                data.showServices !== false ? "bg-emerald-500" : "bg-muted-foreground/30"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-md",
                data.showServices !== false ? "left-6" : "left-0.5"
              )} />
            </button>
          </div>
          
          {data.showServices !== false && (
            <div className="flex bg-background p-1 rounded-lg border border-border/50 w-full sm:w-2/3 ml-auto mr-0">
              <button
                onClick={() => onChange({ ...data, servicesDisplay: "cards" })}
                className={cn(
                  "flex-1 text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium",
                  servicesDisplay === "cards" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Layout className="h-4 w-4" /> Em Cards
              </button>
              <button
                onClick={() => onChange({ ...data, servicesDisplay: "pills" })}
                className={cn(
                  "flex-1 text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium",
                  servicesDisplay === "pills" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <List className="h-4 w-4" /> Em Pílulas
              </button>
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
                data.showPackages !== false ? "bg-emerald-500" : "bg-muted-foreground/30"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-md",
                data.showPackages !== false ? "left-6" : "left-0.5"
              )} />
            </button>
          </div>

          {data.showPackages !== false && (
            <div className="flex bg-background p-1 rounded-lg border border-border/50 w-full sm:w-2/3 ml-auto mr-0">
              <button
                onClick={() => onChange({ ...data, packagesDisplay: "cards" })}
                className={cn(
                  "flex-1 text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium",
                  packagesDisplay === "cards" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Layout className="h-4 w-4" /> Em Cards
              </button>
              <button
                onClick={() => onChange({ ...data, packagesDisplay: "pills" })}
                className={cn(
                  "flex-1 text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium",
                  packagesDisplay === "pills" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <List className="h-4 w-4" /> Em Pílulas
              </button>
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
              <span className="text-xs text-muted-foreground">Digite o nome exato do pacote que deseja destacar visualmente.</span>
            </div>
            <Input
              value={data.featuredPackageName || ""}
              onChange={(e) => onChange({ ...data, featuredPackageName: e.target.value })}
              className="bg-background border-border/50 h-10 focus-visible:ring-1"
              placeholder="Ex: Renovação Semanal"
            />
          </div>
        )}
      </div>

      {/* TEXTO DO CTA */}
      <div className="flex flex-col gap-4 p-5 border border-border/50 rounded-xl bg-muted/10">
        <Label className="text-foreground font-medium text-base">Botão de Agendamento nos Cards</Label>
        <Input
          value={data.ctaText || ""}
          onChange={(e) => onChange({ ...data, ctaText: e.target.value })}
          className="bg-background border-border/50 h-10 focus-visible:ring-1"
          placeholder="Ex: Agendar, Reservar, Quero esse serviço..."
        />
        <p className="text-[11px] text-muted-foreground">Texto exibido no botão de cada card de serviço. Padrão: "Agendar".</p>
      </div>
    </div>
  );
}
