"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, Trash } from "@boxicons/react";
import { Button } from "@/components/ui/button";

export function ProSocialProof({ data, onChange }: any) {
  const addTestimonial = () => {
    const newTestimonial = { id: Date.now().toString(), name: "", text: "", role: "" };
    onChange({ ...data, testimonials: [...(data.testimonials || []), newTestimonial] });
  };

  const removeTestimonial = (id: string) => {
    const filtered = data.testimonials.filter((s: any) => s.id !== id);
    onChange({ ...data, testimonials: filtered });
  };

  const updateTestimonial = (id: string, key: string, value: string) => {
    const updated = data.testimonials.map((s: any) => 
      s.id === id ? { ...s, [key]: value } : s
    );
    onChange({ ...data, testimonials: updated });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Star className="h-5 w-5 text-primary" />
          Depoimentos
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          O que seus clientes dizem sobre você. A prova social é fundamental.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Label className="text-foreground font-medium">Lista de Depoimentos</Label>
          <Button onClick={addTestimonial} variant="outline" size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" /> Adicionar Depoimento
          </Button>
        </div>
        
        <div className="flex flex-col gap-4">
          {(!data.testimonials || data.testimonials.length === 0) ? (
            <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Nenhum depoimento cadastrado. Clique no botão acima para adicionar.
              </p>
            </div>
          ) : (
            data.testimonials.map((testi: any) => (
              <div key={testi.id} className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-card relative group">
                <button 
                  onClick={() => removeTestimonial(testi.id)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                  <Input
                    value={testi.name}
                    onChange={(e) => updateTestimonial(testi.id, "name", e.target.value)}
                    className="bg-background border-border/50 h-10"
                    placeholder="Nome do Cliente"
                  />
                  <Input
                    value={testi.role}
                    onChange={(e) => updateTestimonial(testi.id, "role", e.target.value)}
                    className="bg-background border-border/50 h-10"
                    placeholder="Profissão/Serviço feito (Opcional)"
                  />
                </div>
                <Textarea
                  value={testi.text}
                  onChange={(e) => updateTestimonial(testi.id, "text", e.target.value)}
                  className="bg-background border-border/50 h-20 resize-none"
                  placeholder="Escreva o depoimento aqui..."
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
