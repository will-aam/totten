"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Filter, X } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTeam } from "@/app/actions/team";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface AgendaFiltersState {
  professionalId?: string;
  serviceId?: string;
  type?: "ALL" | "SINGLE" | "PACKAGE";
  status?: string;
}

interface AgendaFiltersProps {
  filters: AgendaFiltersState;
  onFiltersChange: (filters: AgendaFiltersState) => void;
}

export function AgendaFilters({ filters, onFiltersChange }: AgendaFiltersProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";
  
  const [team, setTeam] = useState<{ id: string; display_name: string | null }[]>([]);
  const { data: servicesResponse } = useSWR<any>("services?active=true", apiClient);
  const services = Array.isArray(servicesResponse) ? servicesResponse : servicesResponse?.data || [];

  useEffect(() => {
    async function fetchTeam() {
      if (isOwner) {
        const res = await getTeam();
        if (res.success && res.data) {
          setTeam(res.data);
        }
      }
    }
    fetchTeam();
  }, [isOwner]);

  const hasActiveFilters = 
    !!filters.professionalId || 
    !!filters.serviceId || 
    !!filters.status || 
    (filters.type && filters.type !== "ALL");

  const clearFilters = () => {
    onFiltersChange({ type: "ALL" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full h-9 w-9 relative transition-colors",
            hasActiveFilters 
              ? "bg-primary/10 text-primary hover:bg-primary/20" 
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Filter size="sm" />
          {hasActiveFilters && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 rounded-2xl shadow-xl z-50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-sm">Filtros da Agenda</h4>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              Limpar
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {isOwner && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Profissional
              </Label>
              <Select
                value={filters.professionalId || "ALL"}
                onValueChange={(val) => onFiltersChange({ ...filters, professionalId: val === "ALL" ? undefined : val })}
              >
                <SelectTrigger className="bg-muted/30 border-none rounded-xl h-10">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/50 shadow-lg z-[100]">
                  <SelectItem value="ALL" className="font-medium">Todos</SelectItem>
                  <SelectItem value={session?.user?.id || ""} className="font-medium">Admin</SelectItem>
                  {team.filter((m) => m.id !== session?.user?.id).map((member) => (
                    <SelectItem key={member.id} value={member.id} className="font-medium">
                      {member.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Serviço
            </Label>
            <Select
              value={filters.serviceId || "ALL"}
              onValueChange={(val) => onFiltersChange({ ...filters, serviceId: val === "ALL" ? undefined : val })}
            >
              <SelectTrigger className="bg-muted/30 border-none rounded-xl h-10">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/50 shadow-lg max-h-[200px] z-[100]">
                <SelectItem value="ALL" className="font-medium">Todos</SelectItem>
                {services.map((s: any) => (
                  <SelectItem key={s.id} value={s.id} className="font-medium">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Tipo
            </Label>
            <Select
              value={filters.type || "ALL"}
              onValueChange={(val: any) => onFiltersChange({ ...filters, type: val })}
            >
              <SelectTrigger className="bg-muted/30 border-none rounded-xl h-10">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/50 shadow-lg z-[100]">
                <SelectItem value="ALL" className="font-medium">Todos</SelectItem>
                <SelectItem value="SINGLE" className="font-medium">Avulso</SelectItem>
                <SelectItem value="PACKAGE" className="font-medium">Pacote</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Status
            </Label>
            <Select
              value={filters.status || "ALL"}
              onValueChange={(val) => onFiltersChange({ ...filters, status: val === "ALL" ? undefined : val })}
            >
              <SelectTrigger className="bg-muted/30 border-none rounded-xl h-10">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/50 shadow-lg z-[100]">
                <SelectItem value="ALL" className="font-medium">Todos</SelectItem>
                <SelectItem value="PENDENTE" className="font-medium">Pendente</SelectItem>
                <SelectItem value="CONFIRMADO" className="font-medium">Confirmado</SelectItem>
                <SelectItem value="REALIZADO" className="font-medium">Realizado</SelectItem>
                <SelectItem value="CANCELADO" className="font-medium">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
