"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, User } from "@boxicons/react";
import { cn } from "@/lib/utils";

export function ProfileSettings({ data, onChange }: any) {


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <User className="h-5 w-5 text-primary" />
          Perfil
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Defina como você aparecerá na sua página pública.
        </p>
      </div>

      <div className="flex flex-col gap-6">

        <div className="flex flex-col gap-3">
          <Label className="text-foreground font-medium">Layout do Perfil</Label>
          <div className="flex bg-muted p-1 rounded-lg border border-border/50">
            {[
              { id: "classic", label: "Clássico" },
              { id: "banner", label: "Banner" },
              { id: "header", label: "Header Blur" }
            ].map((layout) => (
              <button
                key={layout.id}
                onClick={() => onChange({ ...data, layout: layout.id })}
                className={cn(
                  "flex-1 text-[11px] sm:text-xs py-2 rounded-md transition-colors font-medium",
                  (data.layout || "classic") === layout.id
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:bg-background/50"
                )}
              >
                {layout.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Escolha como o seu Avatar e Banner (definidos acima) serão exibidos nesta página.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-foreground font-medium">
            Nome de Exibição
          </Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="bg-muted/50 border-border/50 h-11"
            placeholder="Ex: Clínica Totten"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <Label htmlFor="bio" className="text-foreground font-medium">
              Biografia
            </Label>
            <span
              className={`text-[11px] font-medium ${data.bio.length > 160 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {data.bio.length} / 160
            </span>
          </div>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
            maxLength={160}
            className="bg-muted/50 border-border/50 min-h-25 resize-none"
            placeholder="Descreva seu negócio em poucas palavras..."
          />
        </div>
      </div>
    </div>
  );
}
