"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 }),
  );

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("19:00");
  const [loadingSettings, setLoadingSettings] = useState(true);

  const openingHourNumber = Number(openingTime.split(":")[0]) || 8;
  const closingHourNumber = Number(closingTime.split(":")[0]) || 19;

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

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const prevWeek = () => setWeekStart(subDays(weekStart, 7));

  useEffect(() => {
    async function loadSettings() {
      setLoadingSettings(true);
      try {
        const res = await fetch("/api/settings/public");
        if (!res.ok) return;
        const data = await res.json();
        if (data.openingTime) setOpeningTime(data.openingTime);
        if (data.closingTime) setClosingTime(data.closingTime);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const loadAppointments = useCallback(async (date: Date) => {
    setLoadingAppointments(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(`/api/admin/agenda/day?date=${dateStr}`);
      if (!res.ok) {
        setAppointments([]);
        return;
      }
      const data = await res.json();
      setAppointments(data.appointments ?? []);
    } catch (error) {
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments(selectedDate);
  }, [selectedDate, loadAppointments]);

  return (
    <>
      <AdminHeader title="Agenda Diária" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 md:pb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-border/50 pb-6">
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
                      ? "Carregando..."
                      : `Você tem ${appointments.length} agendamentos.`}
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

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center w-full sm:w-auto justify-between sm:justify-center bg-muted/20 sm:bg-transparent rounded-2xl p-1 sm:p-0 border sm:border-0">
              <Button variant="ghost" size="icon" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {weekDays.map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center justify-center h-12 w-10 sm:h-14 sm:w-12 rounded-xl border transition-all",
                      isSameDay(day, selectedDate)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : isSameDay(day, new Date())
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-card text-muted-foreground",
                    )}
                  >
                    <span className="text-[9px] font-bold uppercase">
                      {format(day, "EEE", { locale: ptBR }).substring(0, 3)}
                    </span>
                    <span className="text-base font-bold">
                      {format(day, "dd")}
                    </span>
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => setIsNewModalOpen(true)}
              className="rounded-full w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </div>
        </div>

        <DailyAgendaGrid
          appointments={appointments}
          onAppointmentClick={(appt) => setSelectedAppointment(appt)}
          startHour={openingHourNumber}
          endHour={closingHourNumber}
        />
      </div>

      <NewAppointmentModal
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        openingTime={openingTime}
        closingTime={closingTime}
        onCreated={() => loadAppointments(selectedDate)}
      />

      <AppointmentDetailsModal
        open={!!selectedAppointment}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onRefresh={() => loadAppointments(selectedDate)} // <-- AQUI ESTÁ A CONEXÃO
      />

      <ScheduleSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        initialSettings={{ openingTime, closingTime }}
        onSave={async ({
          openingTime: newOpening,
          closingTime: newClosing,
        }) => {
          setOpeningTime(newOpening);
          setClosingTime(newClosing);
          // Lógica de salvamento via API omitida para brevidade...
        }}
        onClearToday={() => loadAppointments(selectedDate)}
      />
    </>
  );
}
