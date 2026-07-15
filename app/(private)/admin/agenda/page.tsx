// app/admin/agenda/page.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import useSWR from "swr";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LoaderDots,
  Plus,
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { DailyAgendaGrid } from "./_components/daily-agenda-grid";
import { Appointment } from "./_components/appointment-card";
import { WeeklyAgendaGrid } from "./_components/weekly-agenda-grid";
import { MonthlyAgendaGrid } from "./_components/monthly-agenda-grid";
import { NewAppointmentModal } from "./_components/new-appointment-modal";
import { AppointmentDetailsModal } from "./_components/appointment-details-modal";
import { ScheduleSettingsModal } from "./_components/schedule-settings-modal";
import { AgendaHeader } from "./_components/agenda-header";
import { apiClient, ApiError } from "@/lib/api-client";

interface AgendaSettings {
  openingTime: string;
  closingTime: string;
}

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

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>(
    undefined,
  );

  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScroll = useRef(false);
  const [rosterBaseDate, setRosterBaseDate] = useState(new Date());

  // Chave sem prefixo /api: o apiClient já resolve o base path sozinho
  const { data: settings, mutate: mutateSettings } = useSWR<AgendaSettings>(
    "settings",
    apiClient,
  );

  const openingTime = String(settings?.openingTime || "08:00");
  const closingTime = String(settings?.closingTime || "19:00");
  const openingHourNumber = Number(openingTime.split(":")[0]);
  const closingHourNumber = Number(closingTime.split(":")[0]);

  //  LÓGICA DE UNIFICAÇÃO DA ROTA: Calculando os limites com base na view atual
  const { fromISO, toISO } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (viewMode === "day") {
      start = startOfDay(selectedDate);
      end = endOfDay(selectedDate);
    } else if (viewMode === "week") {
      start = startOfWeek(selectedDate, { weekStartsOn: 0 });
      end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    } else {
      // Month
      const mStart = startOfMonth(selectedDate);
      const mEnd = endOfMonth(selectedDate);
      // Pega a semana que contém o primeiro dia e a semana que contém o último dia
      start = startOfWeek(mStart, { weekStartsOn: 0 });
      end = endOfWeek(mEnd, { weekStartsOn: 0 });
    }

    return {
      fromISO: start.toISOString(),
      toISO: end.toISOString(),
    };
  }, [selectedDate, viewMode]);

  //  NOVA E ÚNICA REQUISIÇÃO (Busca a agenda completa para a visualização atual)
  const {
    data: agendaData,
    mutate: mutateAgenda,
    isLoading: loadingAgenda,
  } = useSWR(`admin/agenda?from=${fromISO}&to=${toISO}`, apiClient);

  const mapAppointments = (raw: any) => {
    return (raw?.appointments ?? []).map((appt: any) => ({
      ...appt,
      date_time: appt.date_time ? new Date(appt.date_time) : new Date(),
      time: appt.time || format(new Date(appt.date_time), "HH:mm"),
    })) as Appointment[];
  };

  const currentViewAppointments = useMemo(
    () => mapAppointments(agendaData),
    [agendaData],
  );

  // Filtros em memória (caso a view exija apenas os de hoje na roleta, por ex)
  const appointments = useMemo(
    () =>
      currentViewAppointments.filter((a) =>
        isSameDay(new Date(a.date_time || new Date()), selectedDate),
      ),
    [currentViewAppointments, selectedDate],
  );

  // Para a semana e para o mês usamos os dados puros (já filtrados pelo backend)
  const weekAppointments = currentViewAppointments;
  const monthAppointments = currentViewAppointments;

  useEffect(() => {
    const diff =
      Math.abs(selectedDate.getTime() - rosterBaseDate.getTime()) /
      (1000 * 60 * 60 * 24);
    if (diff > 45) {
      setRosterBaseDate(selectedDate);
    }
  }, [selectedDate, rosterBaseDate]);

  const rouletteDays = useMemo(() => {
    return Array.from({ length: 181 }, (_, i) =>
      addDays(rosterBaseDate, i - 90),
    );
  }, [rosterBaseDate]);

  const goNext = () => {
    if (viewMode === "month") {
      const newDate = addMonths(selectedDate, 1);
      setSelectedDate(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else {
      isProgrammaticScroll.current = true;
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
      isProgrammaticScroll.current = true;
      const newDate = subDays(selectedDate, viewMode === "day" ? 1 : 7);
      setSelectedDate(newDate);
      setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    }
  };

  const mutateAll = () => {
    mutateAgenda();
  };

  const handleSaveSettings = async (newSettings: {
    openingTime: string;
    closingTime: string;
  }) => {
    try {
      await apiClient("settings", {
        method: "PUT",
        body: JSON.stringify(newSettings),
      });
      await mutateSettings();
      toast.success("Horários de funcionamento atualizados!");
    } catch (error) {
      toast.error("Não foi possível salvar os horários.");
      throw error;
    }
  };

  const handleQuickConfirm = async (appt: Appointment) => {
    try {
      await apiClient(`admin/appointments/${appt.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "CONFIRMADO" }),
      });
      toast.success("Agendamento confirmado!");
      mutateAll();
    } catch (error) {
      // Distingue erro de API (apiClient lança ApiError) de falha de rede,
      // preservando as duas mensagens que já existiam antes da refatoração
      if (error instanceof ApiError) {
        toast.error("Falha ao confirmar agendamento.");
      } else {
        toast.error("Erro na conexão.");
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && viewMode !== "month") {
      const container = scrollContainerRef.current;
      const selectedBtn = container.querySelector(
        `[data-date="${format(selectedDate, "yyyy-MM-dd")}"]`,
      ) as HTMLElement;

      if (selectedBtn) {
        const scrollLeft =
          selectedBtn.offsetLeft -
          container.clientWidth / 2 +
          selectedBtn.clientWidth / 2;

        isProgrammaticScroll.current = true;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });

        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 500);
      }
    }
  }, [selectedDate, viewMode, rosterBaseDate]);

  const handleDaysScroll = () => {
    if (isProgrammaticScroll.current) return;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const centerLine = container.scrollLeft + container.clientWidth / 2;
      let minDistance = Infinity;

      let closestDateStr = "";

      const buttons = container.querySelectorAll(".day-btn");
      buttons.forEach((btn) => {
        const el = btn as HTMLElement;
        const btnCenter = el.offsetLeft + el.clientWidth / 2;
        const distance = Math.abs(btnCenter - centerLine);

        if (distance < minDistance) {
          minDistance = distance;
          const attr = el.getAttribute("data-date");
          if (attr) closestDateStr = attr;
        }
      });

      if (closestDateStr !== "") {
        const [y, m, d] = closestDateStr.split("-").map(Number);
        const newDate = new Date(y, m - 1, d);

        if (!isSameDay(newDate, selectedDate)) {
          setSelectedDate(newDate);
          setWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
        }
      }
    }, 150);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const formattedDateDesktop = format(selectedDate, "EEEE, dd MMM", {
    locale: ptBR,
  })
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace("-feira", "");

  const headerTitle =
    viewMode === "week"
      ? `Semana de ${format(weekStart, "dd MMM", { locale: ptBR })}`
      : viewMode === "month"
        ? format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR }).replace(
            /^\w/,
            (c) => c.toUpperCase(),
          )
        : formattedDateDesktop;

  return (
    <>
      <AgendaHeader
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          isProgrammaticScroll.current = true;
          setSelectedDate(date);
          setWeekStart(startOfWeek(date, { weekStartsOn: 0 }));
        }}
        title={headerTitle}
        subtitle={
          loadingAgenda ? (
            <span className="flex items-center gap-1">
              <LoaderDots size="xs" className="animate-spin" /> Atualizando...
            </span>
          ) : viewMode === "day" ? (
            `${appointments.length} agendamentos`
          ) : viewMode === "week" ? (
            `${weekAppointments.length} na semana`
          ) : (
            `${monthAppointments.length} no mês`
          )
        }
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex flex-col gap-4 p-4 md:p-6 max-w-400 mx-auto w-full pb-32 md:pb-6 relative min-h-[calc(100vh-100px)]">
        <div className="flex justify-end pb-4">
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

            <div className="hidden md:flex items-center w-full lg:w-auto justify-between bg-muted/20 lg:bg-transparent rounded-2xl p-1 lg:p-0 shrink-0 overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="h-10 w-10 rounded-full shrink-0 z-20 bg-background/50 backdrop-blur-sm shadow-sm"
              >
                <ChevronLeft removePadding size="sm" />
              </Button>

              {viewMode !== "month" && (
                <div
                  ref={scrollContainerRef}
                  onScroll={handleDaysScroll}
                  className="flex gap-2 lg:gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory flex-1 max-w-60 sm:max-w-[320px] relative px-1 py-1 items-center"
                  style={{
                    maskImage:
                      "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                    WebkitMaskImage:
                      "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                  }}
                >
                  <div className="shrink-0 w-[calc(50%-24px)] sm:w-[calc(50%-28px)]" />

                  {rouletteDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <button
                        key={`roleta-${day.toISOString()}`}
                        data-selected={isSelected}
                        data-date={format(day, "yyyy-MM-dd")}
                        onClick={() => {
                          isProgrammaticScroll.current = true;
                          setSelectedDate(day);
                          setWeekStart(startOfWeek(day, { weekStartsOn: 0 }));
                        }}
                        className={cn(
                          "day-btn snap-center flex flex-col items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-[14px] border transition-all shrink-0 duration-300",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-md border-primary scale-110 z-10"
                            : isToday
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-card text-muted-foreground border-transparent hover:bg-muted opacity-50 hover:opacity-100",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[9px] uppercase",
                            isSelected ? "font-bold" : "font-semibold",
                          )}
                        >
                          {format(day, "EEE", { locale: ptBR }).substring(0, 3)}
                        </span>
                        <span
                          className={cn(
                            "text-sm sm:text-base tracking-tighter",
                            isSelected ? "font-black" : "font-bold",
                          )}
                        >
                          {format(day, "dd")}
                        </span>
                      </button>
                    );
                  })}

                  <div className="shrink-0 w-[calc(50%-24px)] sm:w-[calc(50%-28px)]" />
                </div>
              )}

              {viewMode === "month" && (
                <div className="px-4 text-sm font-bold text-muted-foreground capitalize flex-1 text-center">
                  {format(selectedDate, "MMMM", { locale: ptBR })}
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={goNext}
                className="h-10 w-10 rounded-full shrink-0 z-20 bg-background/50 backdrop-blur-sm shadow-sm"
              >
                <ChevronRight removePadding size="sm" />
              </Button>
            </div>
          </div>
        </div>

        {/* GRIDS DA AGENDA */}
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {viewMode === "day" && (
            <DailyAgendaGrid
              appointments={appointments}
              onAppointmentClick={setSelectedAppointment}
              onRefresh={mutateAll}
              startHour={openingHourNumber}
              endHour={closingHourNumber}
              onEmptySlotClick={(time) => {
                setSelectedTimeSlot(time);
                setIsNewModalOpen(true);
              }}
              onQuickConfirm={handleQuickConfirm}
            />
          )}
          {viewMode === "week" && (
            <WeeklyAgendaGrid
              appointments={weekAppointments}
              weekStart={weekStart}
              onAppointmentClick={setSelectedAppointment}
              startHour={openingHourNumber}
              endHour={closingHourNumber}
              onQuickConfirm={handleQuickConfirm}
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
        onClick={() => {
          setSelectedTimeSlot(undefined);
          setIsNewModalOpen(true);
        }}
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

      <NewAppointmentModal
        open={isNewModalOpen}
        onOpenChange={(open) => {
          setIsNewModalOpen(open);
          if (!open) setSelectedTimeSlot(undefined);
        }}
        openingTime={openingTime}
        closingTime={closingTime}
        initialDate={selectedDate}
        initialTime={selectedTimeSlot}
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
