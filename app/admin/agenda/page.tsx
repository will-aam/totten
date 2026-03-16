// app/admin/agenda/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
  Plus,
  Calendar as CalendarIcon,
  Settings2,
  ArrowUp, // 🔥 Importação do ArrowUp adicionada
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
import { WeeklyAgendaGrid } from "@/components/agenda/weekly-agenda-grid";
import { MonthlyAgendaGrid } from "@/components/agenda/monthly-agenda-grid";
import { NewAppointmentModal } from "@/components/agenda/new-appointment-modal";
import { AppointmentDetailsModal } from "@/components/agenda/appointment-details-modal";
import { ScheduleSettingsModal } from "@/components/agenda/schedule-settings-modal";

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

  // 🔥 Estado para controle do Scroll ao Topo
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Estados da visão Diária
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Estados da visão Semanal
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [loadingWeekAppointments, setLoadingWeekAppointments] = useState(false);

  // Estados da visão Mensal
  const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
  const [loadingMonthAppointments, setLoadingMonthAppointments] =
    useState(false);

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

  // Sincroniza a data selecionada dependendo de qual visão está ativa
  const goNext = () => {
    if (viewMode === "month") {
      const newDate = addMonths(selectedDate, 1);
      setSelectedDate(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else {
      const newDate = addDays(selectedDate, 7);
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
      const newDate = subDays(selectedDate, 7);
      setSelectedDate(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    }
  };

  // 🔥 Listener de Scroll da página inteira
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

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

  // Busca Agendamentos do Dia
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
      const mapped = (data.appointments ?? []).map((appt: any) => ({
        ...appt,
        date_time: appt.date_time ? new Date(appt.date_time) : new Date(),
        time: appt.time || format(new Date(appt.date_time), "HH:mm"),
      }));
      setAppointments(mapped);
    } catch (error) {
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  // Busca Agendamentos da Semana Inteira
  const loadWeekAppointments = useCallback(async (date: Date) => {
    setLoadingWeekAppointments(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(`/api/admin/agenda/week?date=${dateStr}`);
      if (!res.ok) {
        setWeekAppointments([]);
        return;
      }
      const data = await res.json();
      const mapped = (data.appointments ?? []).map((appt: any) => ({
        ...appt,
        date_time: appt.date_time ? new Date(appt.date_time) : new Date(),
        time: appt.time || format(new Date(appt.date_time), "HH:mm"),
      }));
      setWeekAppointments(mapped);
    } catch (error) {
      setWeekAppointments([]);
    } finally {
      setLoadingWeekAppointments(false);
    }
  }, []);

  // Busca Agendamentos do Mês
  const loadMonthAppointments = useCallback(async (date: Date) => {
    setLoadingMonthAppointments(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(`/api/admin/agenda/month?date=${dateStr}`);
      if (!res.ok) {
        setMonthAppointments([]);
        return;
      }
      const data = await res.json();
      const mapped = (data.appointments ?? []).map((appt: any) => ({
        ...appt,
        date_time: appt.date_time ? new Date(appt.date_time) : new Date(),
        time: appt.time || format(new Date(appt.date_time), "HH:mm"),
      }));
      setMonthAppointments(mapped);
    } catch (error) {
      setMonthAppointments([]);
    } finally {
      setLoadingMonthAppointments(false);
    }
  }, []);

  // Dispara carregamento conforme a visão ativa
  useEffect(() => {
    if (viewMode === "day") {
      loadAppointments(selectedDate);
    } else if (viewMode === "week") {
      loadWeekAppointments(weekStart);
    } else if (viewMode === "month") {
      loadMonthAppointments(selectedDate);
    }
  }, [
    selectedDate,
    weekStart,
    viewMode,
    loadAppointments,
    loadWeekAppointments,
    loadMonthAppointments,
  ]);

  // Touch handlers para swipe na visão mensal
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe || isRightSwipe) {
      if (isLeftSwipe) goNext(); // Próximo mês
      if (isRightSwipe) goPrev(); // Mês anterior
    }
  };

  return (
    <>
      <AdminHeader title="Agenda" />

      <div className="flex flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto w-full pb-32 md:pb-6 relative min-h-[calc(100vh-100px)]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex w-full xl:w-auto justify-between items-center">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-muted/50 p-2 -ml-2 rounded-2xl transition-colors group w-fit">
                  <div className="text-left">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-tight flex items-center gap-1.5">
                      <span className="hidden sm:inline-block">
                        {viewMode === "week"
                          ? `Semana de ${format(weekStart, "dd MMM", { locale: ptBR })}`
                          : viewMode === "month"
                            ? format(selectedDate, "MMMM 'de' yyyy", {
                                locale: ptBR,
                              }).replace(/^\w/, (c) => c.toUpperCase())
                            : formattedDateDesktop}
                      </span>
                      <span className="sm:hidden">
                        {viewMode === "week"
                          ? `Sem de ${format(weekStart, "dd/MM")}`
                          : viewMode === "month"
                            ? format(selectedDate, "MMM yyyy", {
                                locale: ptBR,
                              }).replace(/^\w/, (c) => c.toUpperCase())
                            : formattedDateMobile}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {viewMode === "day"
                        ? loadingAppointments
                          ? "Carregando..."
                          : `${appointments.length} agendamentos`
                        : viewMode === "week"
                          ? loadingWeekAppointments
                            ? "Carregando..."
                            : `${weekAppointments.length} na semana`
                          : loadingMonthAppointments
                            ? "Carregando..."
                            : `${monthAppointments.length} no mês`}
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

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-full h-10 w-10 shrink-0 text-muted-foreground hover:bg-muted xl:hidden"
            >
              <Settings2 className="h-5 w-5" />
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
                <TabsTrigger
                  value="day"
                  className="rounded-xl font-bold text-xs sm:text-sm"
                >
                  Dia
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="rounded-xl font-bold text-xs sm:text-sm"
                >
                  Semana
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="rounded-xl font-bold text-xs sm:text-sm"
                >
                  Mês
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center w-full lg:w-auto justify-between bg-muted/20 lg:bg-transparent rounded-2xl p-1 lg:p-0 border lg:border-0 border-border/50 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="shrink-0 h-10 w-10 rounded-full hover:bg-background lg:hover:bg-muted"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              {viewMode !== "month" && (
                <div className="flex gap-1.5 lg:gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden px-1 py-1 snap-x scroll-smooth max-w-[calc(100vw-120px)] lg:max-w-100">
                  {weekDays.map((day) => (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "flex flex-col items-center justify-center h-12 w-10 sm:h-14 sm:w-12 rounded-xl border transition-all shrink-0 snap-center",
                        isSameDay(day, selectedDate)
                          ? "bg-primary text-primary-foreground shadow-sm scale-105 border-primary"
                          : isSameDay(day, new Date())
                            ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            : "bg-card text-muted-foreground hover:bg-muted hover:border-border/80 border-transparent",
                      )}
                    >
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase mb-0.5">
                        {format(day, "EEE", { locale: ptBR }).substring(0, 3)}
                      </span>
                      <span className="text-sm sm:text-base font-bold leading-none">
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
                className="shrink-0 h-10 w-10 rounded-full hover:bg-background lg:hover:bg-muted"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-xl h-11 w-11 shrink-0 bg-card shadow-sm hover:bg-muted hidden xl:flex"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === "day" && (
          <DailyAgendaGrid
            appointments={appointments}
            onAppointmentClick={(appt) => setSelectedAppointment(appt)}
            startHour={openingHourNumber}
            endHour={closingHourNumber}
          />
        )}

        {viewMode === "week" && (
          <WeeklyAgendaGrid
            appointments={weekAppointments}
            weekStart={weekStart}
            onAppointmentClick={(appt) => setSelectedAppointment(appt)}
            startHour={openingHourNumber}
            endHour={closingHourNumber}
          />
        )}

        {viewMode === "month" && (
          <div
            className="flex-1 min-h-0"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <MonthlyAgendaGrid
              appointments={monthAppointments}
              currentDate={selectedDate}
              onAppointmentClick={(appt) => setSelectedAppointment(appt)}
              onDayClick={(day) => {
                setSelectedDate(day);
                setWeekStart(startOfWeek(day, { weekStartsOn: 0 }));
                setViewMode("day");
              }}
            />
          </div>
        )}
      </div>

      {/* 🔥 REVEZAMENTO INTELIGENTE: NOVO AGENDAMENTO vs ARROW UP */}
      <Button
        onClick={() => setIsNewModalOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground flex items-center justify-center z-40 transition-all duration-300",
          showScrollTop
            ? "translate-y-10 opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100 hover:bg-primary/90 hover:scale-105",
        )}
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100 hover:scale-105"
            : "translate-y-10 opacity-0 pointer-events-none",
        )}
      >
        <ArrowUp className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <NewAppointmentModal
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        openingTime={openingTime}
        closingTime={closingTime}
        initialDate={selectedDate}
        onCreated={() => {
          loadAppointments(selectedDate);
          loadWeekAppointments(weekStart);
          loadMonthAppointments(selectedDate);
        }}
      />

      <AppointmentDetailsModal
        open={!!selectedAppointment}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onRefresh={() => {
          loadAppointments(selectedDate);
          loadWeekAppointments(weekStart);
          loadMonthAppointments(selectedDate);
        }}
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
        }}
        onClearToday={() => {
          loadAppointments(selectedDate);
          loadWeekAppointments(weekStart);
          loadMonthAppointments(selectedDate);
        }}
      />
    </>
  );
}
