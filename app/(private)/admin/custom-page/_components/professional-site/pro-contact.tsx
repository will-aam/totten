"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pin, Phone, Search } from "@boxicons/react";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ProContact({ data, onChange }: any) {
  const [cep, setCep] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const handleSearchCep = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    
    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const result = await response.json();
      
      if (!result.erro) {
        const fullAddress = `${result.logradouro}, Número, ${result.bairro}, ${result.localidade} - ${result.uf}, ${result.cep}`;
        onChange({ ...data, address: fullAddress });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    } finally {
      setIsSearchingCep(false);
    }
  };
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
        <div className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-muted/10">
          <Label className="text-sm font-medium">Buscar Endereço (CEP)</Label>
          <div className="flex gap-2">
            <Input
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="00000-000"
              className="bg-background max-w-[200px]"
              maxLength={9}
            />
            <Button 
              variant="secondary" 
              onClick={handleSearchCep} 
              disabled={isSearchingCep || cep.replace(/\D/g, "").length !== 8}
            >
              {isSearchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Buscar</span>
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">O endereço será preenchido abaixo. Você pode editá-lo se necessário.</p>
        </div>

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
            Link do Google Maps
          </Label>
          <Input
            id="mapUrl"
            value={data.mapUrl || ""}
            onChange={(e) => onChange({ ...data, mapUrl: e.target.value })}
            className="bg-background border-border/50 h-11 focus-visible:ring-1"
            placeholder="Ex: https://goo.gl/maps/..."
          />
          <p className="text-[11px] text-muted-foreground">
            Cole o link direto do Google Maps para que seus clientes encontrem sua localização.
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
