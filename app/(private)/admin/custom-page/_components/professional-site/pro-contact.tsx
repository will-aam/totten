"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pin, Phone } from "@boxicons/react";
import { Textarea } from "@/components/ui/textarea";

export function ProContact({ data, onChange }: any) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Pin className="h-5 w-5 text-primary" />
          Localização e Contato
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Informe onde você atende e como os clientes podem te achar.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="address" className="text-foreground font-medium">
            Endereço Completo
          </Label>
          <Textarea
            id="address"
            value={data.address || ""}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            className="bg-background border-border/50 focus-visible:ring-1 min-h-[80px]"
            placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="mapUrl" className="text-foreground font-medium">
            Link do Google Maps (Embed/Iframe)
          </Label>
          <Input
            id="mapUrl"
            value={data.mapUrl || ""}
            onChange={(e) => onChange({ ...data, mapUrl: e.target.value })}
            className="bg-background border-border/50 h-11 focus-visible:ring-1"
            placeholder="Cole o src do Google Maps aqui"
          />
          <p className="text-[11px] text-muted-foreground">
            No Google Maps, vá em "Compartilhar" {'>'} "Incorporar um mapa" e copie o link dentro do src="...".
          </p>
        </div>

        <div className="w-full h-px bg-border/50" />

        <h4 className="font-medium text-sm flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          Outras Formas de Contato
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-xs text-muted-foreground">Telefone Fixo</Label>
            <Input
              id="phone"
              value={data.phone || ""}
              onChange={(e) => onChange({ ...data, phone: e.target.value })}
              className="bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-xs text-muted-foreground">E-mail Profissional</Label>
            <Input
              id="email"
              value={data.email || ""}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              className="bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="contato@seusite.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
