// app/admin/agenda/page.tsx
"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, addDays, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar as CalendarIcon,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  DailyAgendaGrid,
  Appointment,
} from "@/components/agenda/daily-agenda-grid";
import { NewAppointmentModal } from "@/components/agenda/new-appointment-modal";
import { AppointmentDetailsModal } from "@/components/agenda/appointment-details-modal";
import { ScheduleSettingsModal } from "@/components/agenda/schedule-settings-modal";

export default function AgendaPage() {
  // TODO FUTURO:
  // Pegar o organizationId a partir da sessão do admin logado
  const organizationId = "cmm9qg8yj0003cg1ol9a8n9l5";

  // Estado da data SELECIONADA (aquela que mostra a grade)
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Estado da semana VISÍVEL na "Tira da Semana"
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 }),
  );

  // Controles dos Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  // Estado dos agendamentos (dados reais da API)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Horário configurado da agenda (carregado do Prisma)
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("19:00");
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Helpers para converter "08:00" -> 8
  const openingHourNumber = Number(openingTime.split(":")[0]) || 8;
  const closingHourNumber = Number(closingTime.split(":")[0]) || 19;

  // Formatação Responsiva do Dia
  const formattedDateDesktop = format(selectedDate, "EEEE, dd MMM", {
    locale: ptBR,
  })
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace("-feira", "");

  const formattedDateMobile = format(selectedDate, "EEE, dd MMM", {
    locale: ptBR,
  })
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(".", "");

  // Gera os 7 dias da semana a partir do domingo atual visível
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Funções para navegar semanas inteiras
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const prevWeek = () => setWeekStart(subDays(weekStart, 7));

  // Carrega horários de funcionamento a partir das Settings (Prisma)
  useEffect(() => {
    async function loadSettings() {
      if (!organizationId) return;

      setLoadingSettings(true);
      try {
        const res = await fetch(
          `/api/settings/public?organizationId=${organizationId}`,
        );

        if (!res.ok) {
          console.error("Falha ao carregar configurações públicas");
          return;
        }

        const data = await res.json();
        if (data.openingTime) setOpeningTime(data.openingTime);
        if (data.closingTime) setClosingTime(data.closingTime);
      } catch (error) {
        console.error("Erro ao carregar configurações públicas:", error);
      } finally {
        setLoadingSettings(false);
      }
    }

    loadSettings();
  }, [organizationId]);

  // Carrega agendamentos sempre que a data mudar
  useEffect(() => {
    async function loadAppointments() {
      if (!organizationId) {
        setAppointments([]);
        return;
      }

      setLoadingAppointments(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(
          `/api/admin/agenda/day?date=${dateStr}&organizationId=${organizationId}`,
        );

        if (!res.ok) {
          console.error("Falha ao carregar agendamentos do dia");
          setAppointments([]);
          return;
        }

        const data = await res.json();
        setAppointments(data.appointments ?? []);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        setAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    }

    loadAppointments();
  }, [selectedDate, organizationId]);

  return (
    <>
      <AdminHeader title="Agenda Diária" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 md:pb-6">
        {/* CABEÇALHO DA AGENDA */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-border/50 pb-6">
          {/* LADO ESQUERDO: Título + calendário popover */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-muted/50 p-2 -ml-2 rounded-2xl transition-colors group w-fit">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground leading-tight flex items-center gap-2">
                    <span className="hidden sm:inline-block">
                      {formattedDateDesktop}
                    </span>
                    <span className="sm:hidden">{formattedDateMobile}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {loadingAppointments
                      ? "Carregando agendamentos..."
                      : `Você tem ${appointments.length} agendamentos.`}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    {loadingSettings
                      ? "Carregando horário de funcionamento..."
                      : `Funcionamento: ${openingTime} às ${closingTime}`}
                  </p>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-2xl shadow-xl"
              align="start"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setWeekStart(startOfWeek(date, { weekStartsOn: 0 }));
                  }
                }}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {/* LADO DIREITO: tira da semana + configurar + novo */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            {/* Tira da semana */}
            <div className="flex items-center w-full sm:w-auto justify-between sm:justify-center bg-muted/20 sm:bg-transparent rounded-2xl sm:rounded-none p-1 sm:p-0 border sm:border-0 border-border/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevWeek}
                className="shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth snap-x py-1 px-1 max-w-[calc(100vw-110px)] sm:max-w-md [&::-webkit-scrollbar]:hidden">
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  const shortDayName = format(day, "EEE", { locale: ptBR })
                    .substring(0, 3)
                    .replace(".", "");

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "flex flex-col items-center justify-center h-12 w-10 sm:h-14 sm:w-12 rounded-xl sm:rounded-2xl border transition-all shrink-0 snap-center",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground shadow-md scale-105"
                          : isToday
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-card border-border/50 text-muted-foreground hover:border-primary/50 hover:bg-muted/50",
                      )}
                    >
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                        {shortDayName}
                      </span>
                      <span
                        className={cn(
                          "text-base sm:text-lg font-bold mt-0.5 leading-none",
                          isSelected
                            ? "text-primary-foreground"
                            : "text-foreground",
                        )}
                      >
                        {format(day, "dd")}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={nextWeek}
                className="shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Botão Configurar horário (ícone) */}
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl sm:rounded-full shadow-sm shrink-0 h-12 sm:h-10"
              onClick={() => setIsSettingsOpen(true)}
              title="Configurar horário da agenda"
            >
              <Settings2 className="h-4 w-4" />
            </Button>

            {/* Botão Novo */}
            <Button
              className="rounded-xl sm:rounded-full shadow-sm shrink-0 w-full sm:w-auto h-12 sm:h-10 font-semibold"
              onClick={() => setIsNewModalOpen(true)}
            >
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="sm:inline">Novo</span>
            </Button>
          </div>
        </div>

        {/* Grade da agenda */}
        <DailyAgendaGrid
          appointments={appointments}
          onAppointmentClick={(appt) => setSelectedAppointment(appt)}
          startHour={openingHourNumber}
          endHour={closingHourNumber}
        />
      </div>

      {/* Modal: Novo agendamento */}
      <NewAppointmentModal
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        organizationId={organizationId}
        openingTime={openingTime}
        closingTime={closingTime}
        onCreated={() => {
          // força recarregar os agendamentos do dia atual
          setSelectedDate((d) => new Date(d));
        }}
      />

      {/* Modal: Detalhes do agendamento */}
      <AppointmentDetailsModal
        open={!!selectedAppointment}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />

      {/* Modal: Configuração de horário */}
      <ScheduleSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        initialSettings={{
          openingTime,
          closingTime,
        }}
        onSave={async ({
          openingTime: newOpening,
          closingTime: newClosing,
        }) => {
          // Atualiza no estado imediatamente (para feedback)
          setOpeningTime(newOpening);
          setClosingTime(newClosing);

          // Persiste no Prisma via API
          try {
            const res = await fetch("/api/settings/hours", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                organizationId,
                openingTime: newOpening,
                closingTime: newClosing,
              }),
            });

            if (!res.ok) {
              console.error("Falha ao salvar horários no backend");
              // Opcional: você pode mostrar um toast de erro aqui
            }
          } catch (error) {
            console.error("Erro ao salvar horários no backend:", error);
          }
        }}
      />
    </>
  );
}
