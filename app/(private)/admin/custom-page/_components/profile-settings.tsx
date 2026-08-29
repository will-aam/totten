"use client";

import { useState } from "react";
import { User } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ProfileSettings({ data, onChange }: any) {


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Perfil
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Defina como você aparecerá na sua página pública.
        </p>
      </div>

      <div className="flex flex-col gap-6">

        <div className="flex flex-col gap-3">
          <Label className="text-foreground font-semibold">1.1 Layout do Perfil</Label>
          <div className="flex flex-col gap-3">
            {[
              { id: "classic", label: "Clássico", desc: "Foto de perfil sobre o banner com os links abaixo." },
              { id: "banner", label: "Banner", desc: "Destaque total para o banner no topo da página." },
              { id: "header", label: "Header Blur", desc: "Efeito de desfoque elegante no cabeçalho." },
            ].map((option) => {
              const isSelected = data.layout === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => onChange({ ...data, layout: option.id })}
                  className={cn(
                    "cursor-pointer border rounded-xl p-4 flex items-center gap-4 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-card hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    isSelected ? "border-primary" : "border-muted-foreground/30"
                  )}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
                      {option.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {option.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Escolha como o seu Avatar e Banner (definidos nas Configurações Globais) serão exibidos nesta página.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <Label htmlFor="bio" className="text-foreground font-semibold">
              1.2 Descreva brevemente seu negócio
            </Label>
            <span
              className={`text-[11px] font-medium ${(data.bio?.length || 0) > 300 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {data.bio?.length || 0} caracteres
            </span>
          </div>
          <Textarea
            id="bio"
            value={data.bio || ""}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
            className="bg-background min-h-32 resize-none"
            placeholder="Descreva seu negócio, sua história ou missão. Este texto será exibido no seu Link na Bio."
          />
        </div>

      </div>
    </div>
  );
}
