"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Plus } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Mock de serviços que "viriam do banco de dados"
const MOCK_SERVICES = [
  { id: "s1", title: "Limpeza de Pele Profunda", price: "R$ 150", description: "Procedimento completo para remoção de cravos, miliuns e impurezas da pele." },
  { id: "s2", title: "Massagem Relaxante", price: "R$ 120", description: "Sessão de 50 minutos para alívio de tensões musculares e relaxamento profundo." },
  { id: "s3", title: "Drenagem Linfática", price: "R$ 180", description: "Ideal para redução de medidas, retenção de líquidos e celulite." },
];

export function ProServices({ data, onChange }: any) {
  const toggleService = (srv: any, checked: boolean) => {
    let currentList = data.servicesList || [];
    if (checked) {
      currentList = [...currentList, srv];
    } else {
      currentList = currentList.filter((s: any) => s.id !== srv.id);
    }
    onChange({ ...data, servicesList: currentList });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Briefcase className="h-5 w-5 text-primary" />
          Serviços e Agendamento
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Liste os principais serviços que você oferece e adicione seu botão de ação.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cta" className="text-foreground font-medium">
            Botão de Agendamento (Call to Action principal)
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="cta_text"
              value={data.ctaText || ""}
              onChange={(e) => onChange({ ...data, ctaText: e.target.value })}
              className="bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="Ex: Agendar Avaliação"
            />
            <Input
              id="cta_link"
              value={data.ctaLink || ""}
              onChange={(e) => onChange({ ...data, ctaLink: e.target.value })}
              className="bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="w-full h-px bg-border/50" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-medium">Seus Serviços Cadastrados</Label>
            <Link href="/admin/services">
              <Button variant="outline" size="sm" className="h-8 shadow-sm">
                <Plus className="h-4 w-4 mr-1" /> Gerenciar no Sistema
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              Selecione quais serviços você deseja exibir no seu site profissional. Eles são puxados automaticamente do seu cadastro de serviços.
            </p>
            <div className="flex flex-col gap-3">
              {MOCK_SERVICES.map((srv) => {
                const isSelected = data.servicesList?.some((s: any) => s.id === srv.id);
                return (
                  <label 
                    key={srv.id} 
                    className={cn(
                      "flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all",
                      isSelected ? "border-primary bg-primary/5" : "border-border/50 bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="pt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border/80 text-primary focus:ring-primary accent-primary"
                        checked={isSelected || false}
                        onChange={(e) => toggleService(srv, e.target.checked)}
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm text-foreground">{srv.title}</span>
                        <span className="font-medium text-sm text-muted-foreground">{srv.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{srv.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
