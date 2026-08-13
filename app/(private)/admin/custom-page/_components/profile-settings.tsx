"use client";

import { useState } from "react";
import { User } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <Select value={data.layout || "classic"} onValueChange={(val) => onChange({ ...data, layout: val })}>
            <SelectTrigger className="bg-background h-11 w-full">
              <SelectValue placeholder="Selecione o layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic">Clássico</SelectItem>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="header">Header Blur</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Escolha como o seu Avatar e Banner (definidos acima) serão exibidos nesta página.
          </p>
        </div>

      </div>
    </div>
  );
}
