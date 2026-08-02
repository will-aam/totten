"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Plus, Trash } from "@boxicons/react";
import { Button } from "@/components/ui/button";

export function ProServices({ data, onChange }: any) {
  const addService = () => {
    const newService = { id: Date.now().toString(), title: "", description: "", price: "" };
    onChange({ ...data, servicesList: [...(data.servicesList || []), newService] });
  };

  const removeService = (id: string) => {
    const filtered = data.servicesList.filter((s: any) => s.id !== id);
    onChange({ ...data, servicesList: filtered });
  };

  const updateService = (id: string, key: string, value: string) => {
    const updated = data.servicesList.map((s: any) => 
      s.id === id ? { ...s, [key]: value } : s
    );
    onChange({ ...data, servicesList: updated });
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
            <Label className="text-foreground font-medium">Seus Serviços</Label>
            <Button onClick={addService} variant="outline" size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" /> Adicionar Serviço
            </Button>
          </div>
          
          <div className="flex flex-col gap-4">
            {(!data.servicesList || data.servicesList.length === 0) ? (
              <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  Nenhum serviço cadastrado. Clique no botão acima para adicionar.
                </p>
              </div>
            ) : (
              data.servicesList.map((srv: any, index: number) => (
                <div key={srv.id} className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-card relative group">
                  <button 
                    onClick={() => removeService(srv.id)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3 pr-8">
                    <Input
                      value={srv.title}
                      onChange={(e) => updateService(srv.id, "title", e.target.value)}
                      className="bg-background border-border/50 h-10"
                      placeholder="Nome do Serviço (Ex: Limpeza de Pele)"
                    />
                    <Input
                      value={srv.price}
                      onChange={(e) => updateService(srv.id, "price", e.target.value)}
                      className="bg-background border-border/50 h-10"
                      placeholder="Preço (Ex: R$ 150)"
                    />
                  </div>
                  <Textarea
                    value={srv.description}
                    onChange={(e) => updateService(srv.id, "description", e.target.value)}
                    className="bg-background border-border/50 h-20 resize-none"
                    placeholder="Descrição breve do serviço..."
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
