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

export interface AgendaFiltersState {
  professionalId?: string;
  serviceId?: string;
  type?: "ALL" | "SINGLE" | "PACKAGE";
  status?: string;
  patientId?: string;
  roomId?: string;
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
    !!filters.patientId ||
    !!filters.roomId ||
    (filters.type && filters.type !== "ALL");

  const clearFilters = () => {
    onFiltersChange({ type: "ALL" });
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
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AgendaFilterForm({ filters, onFiltersChange, isOwner, team, services, session, clients }: any) {
  const [clientOpen, setClientOpen] = useState(false);
  const hasActiveFilters =
    !!filters.professionalId ||
    !!filters.serviceId ||
    !!filters.status ||
    !!filters.patientId ||
    !!filters.roomId ||
    (filters.type && filters.type !== "ALL");

  const clearFilters = () => {
    onFiltersChange({ type: "ALL" });
  };

  // Custom wrapper for the trigger to match the design EXACTLY
  const CustomTrigger = ({ placeholder }: { placeholder: string }) => (
    <SelectTrigger className="w-full bg-muted/20 border border-input -[10px] h-10 px-3 [&>svg]:hidden flex justify-between items-center shadow-none text-muted-foreground hover:bg-muted/40 transition-colors focus:ring-1 focus:ring-primary/20 font-medium">
      <SelectValue placeholder={placeholder} />
      <div className="bg-muted/60 rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground">
        <ChevronDown className="w-4 h-4" />
      </div>
    </SelectTrigger>
  );

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
        <Select
          value={filters.status || "ALL"}
          onValueChange={(val) => onFiltersChange({ ...filters, status: val === "ALL" ? undefined : val })}
        >
          <CustomTrigger placeholder="Todos" />
          <SelectContent className="border border-border/50 shadow-lg z-[100] rounded-2xl">
            <SelectItem value="ALL" className="font-medium text-muted-foreground">Todos</SelectItem>
            <SelectItem value="PENDENTE" className="font-medium">Pendente</SelectItem>
            <SelectItem value="CONFIRMADO" className="font-medium">Confirmado</SelectItem>
            <SelectItem value="REALIZADO" className="font-medium">Realizado</SelectItem>
            <SelectItem value="CANCELADO" className="font-medium">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 2. Profissional */}
      {isOwner && (
        <div className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">
            Profissional
          </Label>
          <Select
            value={filters.professionalId || "ALL"}
            onValueChange={(val) => onFiltersChange({ ...filters, professionalId: val === "ALL" ? undefined : val })}
          >
            <CustomTrigger placeholder="Todos" />
            <SelectContent className="border border-border/50 shadow-lg z-[100] rounded-2xl">
              <SelectItem value="ALL" className="font-medium text-muted-foreground">Todos</SelectItem>
              <SelectItem value={session?.user?.id || ""} className="font-medium">{session?.user?.name || "Admin"}</SelectItem>
              {team?.filter((m: any) => m.id !== session?.user?.id).map((member: any) => (
                <SelectItem key={member.id} value={member.id} className="font-medium">
                  {member.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 3. Paciente */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-muted-foreground">
          Paciente
        </Label>
        <Popover open={clientOpen} onOpenChange={setClientOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={clientOpen}
              className="w-full bg-muted/20 border border-input rounded-lg h-10 px-3 flex justify-between items-center shadow-none text-muted-foreground hover:bg-muted/40 transition-colors focus:ring-1 focus:ring-primary/20 font-medium font-normal"
            >
              <span className="truncate">
                {filters.patientId
                  ? clients?.find((c: any) => c.id === filters.patientId)?.name
                  : "Todos"}
              </span>
              <div className="bg-muted/60 rounded-md h-6 w-6 flex items-center justify-center text-muted-foreground shrink-0">
                <ChevronDown className="w-4 h-4" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 rounded-xl border border-border/50 shadow-lg z-[100]" align="start">
            <Command>
              <CommandInput placeholder="Pesquisar paciente..." className="h-9" />
              <CommandList>
                <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="Todos"
                    onSelect={() => {
                      onFiltersChange({ ...filters, patientId: undefined });
                      setClientOpen(false);
                    }}
                  >
                    Todos
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        !filters.patientId ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                  {clients?.map((c: any) => (
                    <CommandItem
                      key={c.id}
                      value={c.name}
                      onSelect={() => {
                        onFiltersChange({ ...filters, patientId: c.id });
                        setClientOpen(false);
                      }}
                    >
                      {c.name}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          filters.patientId === c.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* 4. Procedimento */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-muted-foreground">
          Procedimento
        </Label>
        <Select
          value={filters.serviceId || "ALL"}
          onValueChange={(val) => onFiltersChange({ ...filters, serviceId: val === "ALL" ? undefined : val })}
        >
          <CustomTrigger placeholder="Todos" />
          <SelectContent className="border border-border/50 shadow-lg max-h-[200px] z-[100] rounded-2xl">
            <SelectItem value="ALL" className="font-medium text-muted-foreground">Todos</SelectItem>
            {services?.map((s: any) => (
              <SelectItem key={s.id} value={s.id} className="font-medium">
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium text-[#666666]">Tipo</Label>
        <Select value={filters.type || "ALL"} onValueChange={(val: any) => onFiltersChange({ ...filters, type: val })}>
          <CustomTrigger placeholder="Todos" />
          <SelectContent className="border border-border/50 shadow-lg z-[100] rounded-2xl">
            <SelectItem value="ALL" className="font-medium text-muted-foreground">Todos</SelectItem>
            <SelectItem value="SINGLE" className="font-medium">Avulso</SelectItem>
            <SelectItem value="PACKAGE" className="font-medium">Pacote</SelectItem>
          </SelectContent>
        </Select>
      </div>


    </div>
  );
}
