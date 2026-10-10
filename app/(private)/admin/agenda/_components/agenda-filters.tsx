"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Filter, ChevronDown } from "@boxicons/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MultiSelectCombobox } from "./multi-select-combobox";

export interface AgendaFiltersState {
  professionalIds?: string[];
  serviceIds?: string[];
  type?: string;
  statuses?: string[];
  patientIds?: string[];
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

  const { data: clientsResponse } = useSWR<any>("clients?limit=1000&active=true", apiClient);
  const clients = Array.isArray(clientsResponse) ? clientsResponse : clientsResponse?.data || [];

  const { data: settings } = useSWR<any>("settings", apiClient);

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
    (filters.professionalIds && filters.professionalIds.length > 0) ||
    (filters.serviceIds && filters.serviceIds.length > 0) ||
    (filters.statuses && filters.statuses.length > 0) ||
    (filters.patientIds && filters.patientIds.length > 0) ||
    (filters.type && filters.type !== "ALL");

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full h-9 w-9 relative transition-colors",
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
      </SheetTrigger>
      <SheetContent side="bottom" className="p-0 flex flex-col max-h-[85dvh] border-t-0 shadow-2xl">
        <SheetHeader className="px-6 py-5 border-b text-left shrink-0">
          <SheetTitle className="font-bold text-lg">Filtros da Agenda</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-12 custom-scrollbar">
          <AgendaFilterForm
            filters={filters}
            onFiltersChange={onFiltersChange}
            isOwner={isOwner}
            team={team}
            services={services}
            session={session}
            clients={clients}
            settings={settings}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AgendaFilterForm({ filters, onFiltersChange, isOwner, team, services, session, clients, settings }: any) {
  const hasActiveFilters =
    (filters.professionalIds && filters.professionalIds.length > 0) ||
    (filters.serviceIds && filters.serviceIds.length > 0) ||
    (filters.statuses && filters.statuses.length > 0) ||
    (filters.patientIds && filters.patientIds.length > 0) ||
    (filters.type && filters.type !== "ALL");

  const clearFilters = () => {
    onFiltersChange({});
  };

  const CustomTrigger = ({ placeholder }: { placeholder: string }) => (
    <SelectTrigger className="w-full bg-muted/20 border border-input -[10px] h-10 px-3 [&>svg]:hidden flex justify-between items-center shadow-none text-muted-foreground hover:bg-muted/40 transition-colors focus:ring-1 focus:ring-primary/20 font-medium font-normal">
      <SelectValue placeholder={placeholder} />
      <div className="bg-muted/60 rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground shrink-0 self-start mt-0.5">
        <ChevronDown className="w-4 h-4" />
      </div>
    </SelectTrigger>
  );

  const statusOptions = [
    { value: "PENDENTE", label: "Pendente" },
    { value: "CONFIRMADO", label: "Confirmado" },
    { value: "REALIZADO", label: "Realizado" },
    ...(settings?.autoCompleteOnCheckin === false ? [{ value: "CHECKIN", label: "Check-in Realizado" }] : []),
    { value: "CANCELADO", label: "Cancelado" },
    { value: "FALTA", label: "Falta" },
  ];

  const professionalOptions = [
    ...(session?.user ? [{ value: session.user.id, label: session.user.name || "Admin" }] : []),
    ...(team?.filter((m: any) => m.id !== session?.user?.id).map((member: any) => ({
      value: member.id,
      label: member.display_name,
    })) || [])
  ];

  const clientOptions = clients?.map((c: any) => ({
    value: c.id,
    label: c.name,
  })) || [];

  const serviceOptions = services?.map((s: any) => ({
    value: s.id,
    label: s.name,
  })) || [];

  const typeOptions = [
    { value: "SINGLE", label: "Avulso" },
    { value: "PACKAGE", label: "Pacote" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold text-lg text-foreground">Filtros</h4>
        {hasActiveFilters ? (
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-primary hover:underline"
          >
            Limpar filtro
          </button>
        ) : (
          <span className="text-sm font-medium text-primary opacity-70 cursor-default">Limpar filtro</span>
        )}
      </div>

      {/* 1. Status */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-muted-foreground">
          Status
        </Label>
        <MultiSelectCombobox
          options={statusOptions}
          selectedValues={filters.statuses || []}
          onSelectedValuesChange={(val) => onFiltersChange({ ...filters, statuses: val })}
          placeholder="Todos os status"
          searchPlaceholder="Pesquisar status..."
        />
      </div>

      {/* 2. Profissional */}
      {isOwner && (
        <div className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">
            Profissional
          </Label>
          <MultiSelectCombobox
            options={professionalOptions}
            selectedValues={filters.professionalIds || []}
            onSelectedValuesChange={(val) => onFiltersChange({ ...filters, professionalIds: val })}
            placeholder="Todos os profissionais"
            searchPlaceholder="Pesquisar profissional..."
          />
        </div>
      )}

      {/* 3. Cliente */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-muted-foreground">
          Cliente
        </Label>
        <MultiSelectCombobox
          options={clientOptions}
          selectedValues={filters.patientIds || []}
          onSelectedValuesChange={(val) => onFiltersChange({ ...filters, patientIds: val })}
          placeholder="Todos os clientes"
          searchPlaceholder="Pesquisar cliente..."
        />
      </div>

      {/* 4. Procedimento */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-muted-foreground">
          Procedimento
        </Label>
        <MultiSelectCombobox
          options={serviceOptions}
          selectedValues={filters.serviceIds || []}
          onSelectedValuesChange={(val) => onFiltersChange({ ...filters, serviceIds: val })}
          placeholder="Todos os procedimentos"
          searchPlaceholder="Pesquisar procedimento..."
        />
      </div>

      {/* 5. Tipo */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-muted-foreground">
          Tipo
        </Label>
        <Select value={filters.type || "ALL"} onValueChange={(val: any) => onFiltersChange({ ...filters, type: val })}>
          <CustomTrigger placeholder="Todos" />
          <SelectContent className="w-[var(--radix-select-trigger-width)] border border-border/50 shadow-lg z-[100] rounded-xl">
            <SelectItem value="ALL" className="font-medium text-muted-foreground">Todos os tipos</SelectItem>
            <SelectItem value="SINGLE" className="font-medium">Avulso</SelectItem>
            <SelectItem value="PACKAGE" className="font-medium">Pacote</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  );
}

