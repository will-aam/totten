// app/admin/agenda/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import {
  format,
  startOfWeek,
  addDays,
  subDays,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CalendarAlt,
  Slider,
  LoaderDots,
} from "@boxicons/react";
import { Plus } from "@boxicons/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
import { WeeklyAgendaGrid } from "@/components/agenda/weekly-agenda-grid";
import { MonthlyAgendaGrid } from "@/components/agenda/monthly-agenda-grid";

import { NewAppointmentModal } from "@/components/agenda/new-appointment-modal";
import { AppointmentDetailsModal } from "@/components/agenda/appointment-details-modal";
import { ScheduleSettingsModal } from "@/components/agenda/schedule-settings-modal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 }),
  );
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: settings, mutate: mutateSettings } = useSWR(
    "/api/settings",
    fetcher,
  );

  const openingTime = settings?.openingTime || "08:00";
  const closingTime = settings?.closingTime || "19:00";
  const openingHourNumber = Number(openingTime.split(":")[0]);
  const closingHourNumber = Number(closingTime.split(":")[0]);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const weekStr = format(weekStart, "yyyy-MM-dd");

  const {
    data: dayRaw,
    mutate: mutateDay,
    isLoading: loadingDay,
  } = useSWR(
    viewMode === "day" ? `/api/admin/agenda/day?date=${dateStr}` : null,
    fetcher,
  );

  const {
    data: weekRaw,
    mutate: mutateWeek,
    isLoading: loadingWeek,
  } = useSWR(
    viewMode === "week" ? `/api/admin/agenda/week?date=${weekStr}` : null,
    fetcher,
  );

  const {
    data: monthRaw,
    mutate: mutateMonth,
    isLoading: loadingMonth,
  } = useSWR(
    viewMode === "month" ? `/api/admin/agenda/month?date=${dateStr}` : null,
    fetcher,
  );

  const mapAppointments = (raw: any) => {
    return (raw?.appointments ?? []).map((appt: any) => ({
      ...appt,
      date_time: appt.date_time ? new Date(appt.date_time) : new Date(),
      time: appt.time || format(new Date(appt.date_time), "HH:mm"),
    })) as Appointment[];
  };

  const appointments = useMemo(() => mapAppointments(dayRaw), [dayRaw]);
  const weekAppointments = useMemo(() => mapAppointments(weekRaw), [weekRaw]);
  const monthAppointments = useMemo(
    () => mapAppointments(monthRaw),
    [monthRaw],
  );

  const goNext = () => {
    if (viewMode === "month") {
      const newDate = addMonths(selectedDate, 1);
      setSelectedDate(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else {
      const newDate = addDays(selectedDate, viewMode === "day" ? 1 : 7);
      setSelectedDate(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    }
  };

  const goPrev = () => {
    if (viewMode === "month") {
      const newDate = subMonths(selectedDate, 1);
      setSelectedDate(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else {
      const newDate = subDays(selectedDate, viewMode === "day" ? 1 : 7);
      setSelectedDate(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    }
  };

  const mutateAll = () => {
    mutateDay();
    mutateWeek();
    mutateMonth();
  };

  const handleSaveSettings = async (newSettings: {
    openingTime: string;
    closingTime: string;
  }) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar");
      }

      await mutateSettings();
      toast.success("Horários de funcionamento atualizados!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar os horários.",
      );
      throw error;
    }
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const formattedDateDesktop = format(selectedDate, "EEEE, dd MMM", {
    locale: ptBR,
  })
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace("-feira", "");

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <AdminHeader title="Agenda" />

      <div className="flex flex-col gap-4 p-4 md:p-6 max-w-400 mx-auto w-full pb-32 md:pb-6 relative min-h-[calc(100vh-100px)]">
        {/* HEADER DA AGENDA */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex w-full xl:w-auto justify-between items-center">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-muted/50 p-2 -ml-2 rounded-2xl transition-colors group w-fit">
                  <div className="text-left">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-tight flex items-center gap-1.5">
                      <span>
                        {viewMode === "week"
                          ? `Semana de ${format(weekStart, "dd MMM", { locale: ptBR })}`
                          : viewMode === "month"
                            ? format(selectedDate, "MMMM 'de' yyyy", {
                                locale: ptBR,
                              }).replace(/^\w/, (c) => c.toUpperCase())
                            : formattedDateDesktop}
                      </span>
                      <ChevronDown
                        size="sm"
                        className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                      />
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                      {loadingDay || loadingWeek || loadingMonth ? (
                        <span className="flex items-center gap-1">
                          <LoaderDots size="xs" className="animate-spin" />
                          Atualizando...
                        </span>
                      ) : viewMode === "day" ? (
                        `${appointments.length} agendamentos`
                      ) : viewMode === "week" ? (
                        `${weekAppointments.length} na semana`
                      ) : (
                        `${monthAppointments.length} no mês`
                      )}
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
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-full h-10 w-10 shrink-0 text-muted-foreground hover:bg-muted xl:hidden"
            >
              <Slider size="sm" />
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-end gap-3 w-full xl:w-auto flex-wrap">
            <Tabs
              value={viewMode}
              onValueChange={(val) =>
                setViewMode(val as "day" | "week" | "month")
              }
              className="w-full lg:w-auto shrink-0"
            >
              <TabsList className="grid w-full lg:w-64 grid-cols-3 h-11 rounded-2xl bg-muted/40 p-1">
                <TabsTrigger value="day" className="rounded-xl font-bold">
                  Dia
                </TabsTrigger>
                <TabsTrigger value="week" className="rounded-xl font-bold">
                  Semana
                </TabsTrigger>
                <TabsTrigger value="month" className="rounded-xl font-bold">
                  Mês
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center w-full lg:w-auto justify-between bg-muted/20 lg:bg-transparent rounded-2xl p-1 lg:p-0 border lg:border-0 border-border/50 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="h-10 w-10 rounded-full"
              >
                <ChevronLeft size="sm" />
              </Button>

              {viewMode !== "month" && (
                <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden px-1">
                  {weekDays.map((day) => (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "flex flex-col items-center justify-center h-12 w-10 sm:h-14 sm:w-12 rounded-xl border transition-all shrink-0",
                        isSameDay(day, selectedDate)
                          ? "bg-primary text-primary-foreground shadow-sm border-primary scale-105"
                          : isSameDay(day, new Date())
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-card text-muted-foreground border-transparent hover:bg-muted",
                      )}
                    >
                      <span className="text-[9px] font-bold uppercase">
                        {format(day, "EEE", { locale: ptBR }).substring(0, 3)}
                      </span>
                      <span className="text-sm sm:text-base font-bold">
                        {format(day, "dd")}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {viewMode === "month" && (
                <div className="px-4 text-sm font-bold text-muted-foreground capitalize">
                  {format(selectedDate, "MMMM", { locale: ptBR })}
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={goNext}
                className="h-10 w-10 rounded-full"
              >
                <ChevronRight size="sm" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-xl h-11 w-11 shrink-0 bg-card shadow-sm hidden xl:flex"
            >
              <Slider size="sm" />
            </Button>
          </div>
        </div>

        {/* GRIDS DA AGENDA */}
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {viewMode === "day" && (
            <DailyAgendaGrid
              appointments={appointments}
              onAppointmentClick={setSelectedAppointment}
              onRefresh={mutateDay}
              startHour={openingHourNumber}
              endHour={closingHourNumber}
            />
          )}
          {viewMode === "week" && (
            <WeeklyAgendaGrid
              appointments={weekAppointments}
              weekStart={weekStart}
              onAppointmentClick={setSelectedAppointment}
              startHour={openingHourNumber}
              endHour={closingHourNumber}
            />
          )}
          {viewMode === "month" && (
            <MonthlyAgendaGrid
              appointments={monthAppointments}
              currentDate={selectedDate}
              onAppointmentClick={setSelectedAppointment}
              onDayClick={(day) => {
                setSelectedDate(day);
                setWeekStart(startOfWeek(day, { weekStartsOn: 0 }));
                setViewMode("day");
              }}
            />
          )}
        </div>
      </div>

      {/* BOTÕES FLUTUANTES */}
      <Button
        onClick={() => setIsNewModalOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground z-40 transition-all duration-300",
          showScrollTop
            ? "translate-y-16 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100 hover:scale-110",
        )}
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100 hover:scale-110"
            : "translate-y-16 opacity-0 pointer-events-none",
        )}
      >
        <ChevronUp size="base" removePadding />
      </button>

      {/* MODAIS */}
      <NewAppointmentModal
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        openingTime={openingTime}
        closingTime={closingTime}
        initialDate={selectedDate}
        onCreated={mutateAll}
      />
      <AppointmentDetailsModal
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onRefresh={mutateAll}
      />
      <ScheduleSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        initialSettings={{ openingTime, closingTime }}
        onSave={handleSaveSettings}
        onClearToday={mutateAll}
      />
    </>
  );
}
