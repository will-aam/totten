"use client";

import React, { useState } from "react";
import { format, formatDistanceToNow, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Phone, CheckCircle, Clock, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { Couch } from "@/components/icons/couch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateAppointment } from "@/app/actions/appointments";
import { Appointment } from "./appointment-card";
import { cn } from "@/lib/utils";

interface AgendaWaitingRoomProps {
  appointments: Appointment[];
  selectedDate: Date;
  onAppointmentClick: (appt: Appointment) => void;
  onRefresh: () => void;
  onBackToCalendar: () => void;
}

export function AgendaWaitingRoom({
  appointments,
  selectedDate,
  onAppointmentClick,
  onRefresh,
  onBackToCalendar,
}: AgendaWaitingRoomProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Filtrar apenas os agendamentos que têm check-in realizado e ainda não foram concluídos/cancelados
  const waitingList = appointments.filter((appt) => {
    const isDateMatch = isSameDay(new Date(appt.date_time || new Date()), selectedDate);
    const hasCheckIn = !!appt.checkInTime;
    const isPendingOrConfirmed =
      appt.status !== "REALIZADO" && appt.status !== "CANCELADO";
    return isDateMatch && hasCheckIn && isPendingOrConfirmed;
  });

  const handleComplete = async (appt: Appointment) => {
    setCompletingId(appt.id);
    const toastId = toast.loading(`Concluindo atendimento de ${appt.clientName}...`);

    try {
      const res = await updateAppointment(
        appt.id,
        {
          status: "realizado",
          paymentMethod: appt.paymentMethod || null,
          paymentMethodId: appt.paymentMethodId || null,
          observations: appt.observations || "",
          hasCharge: false,
        },
        false,
        appt.recurrence_id,
      );

      if (res.success) {
        toast.success(`Atendimento de ${appt.clientName} concluído com sucesso!`, {
          id: toastId,
        });
        onRefresh();
      } else {
        toast.error(res.error || "Erro ao concluir atendimento.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro de conexão ao concluir atendimento.", {
        id: toastId,
      });
    } finally {
      setCompletingId(null);
    }
  };

  const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="flex flex-col gap-6 w-full max-w-400 mx-auto p-4 md:p-6 pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
      {/* Cabeçalho da Sala de Espera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
            <Couch size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                Sala de Espera
              </h2>
              <Badge className="bg-purple-600 hover:bg-purple-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                {waitingList.length} {waitingList.length === 1 ? "aguardando" : "aguardando"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium capitalize mt-0.5">
              {formattedDate}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onBackToCalendar}
          className="flex items-center gap-2 rounded-xl border-border/60 hover:bg-accent font-bold text-xs h-10 px-4 self-start sm:self-auto"
        >
          <CalendarIcon className="h-4 w-4" />
          <span>Voltar para Grade da Agenda</span>
        </Button>
      </div>

      {/* Lista de Espera */}
      {waitingList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card/60 backdrop-blur-xs rounded-3xl border border-dashed border-border/70 p-8 shadow-xs">
          <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
            <Couch size={32} />
          </div>
          <h3 className="text-lg font-bold text-foreground">Sala de Espera Vazia</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1.5 max-w-md">
            Nenhum cliente aguardando atendimento nesta data. Quando um cliente realizar o check-in presencial ou no totem, o card roxo aparecerá aqui.
          </p>
          <Button
            onClick={onBackToCalendar}
            variant="secondary"
            className="mt-6 rounded-xl font-bold text-xs h-9 px-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Agenda
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {waitingList.map((appt) => {
            const checkInDate = appt.checkInTime ? new Date(appt.checkInTime) : null;
            const waitingTimeStr = checkInDate
              ? formatDistanceToNow(checkInDate, { locale: ptBR })
              : "recém chegado";

            const rawPrice = Number(appt.price || 0);
            const depositPaid = Number(appt.deposit_paid_amount || 0);
            const remainingPrice = Math.max(0, rawPrice - depositPaid);

            const isPackage = Boolean(appt.package_id || appt.isRecurring);

            return (
              <div
                key={appt.id}
                className="bg-card border border-purple-200 dark:border-purple-900/40 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />

                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-700 dark:text-purple-300 font-black text-sm shrink-0 border border-purple-200 dark:border-purple-900">
                        {appt.clientName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-base text-foreground truncate leading-tight">
                          {appt.clientName}
                        </h4>
                        {appt.phone && (
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            {appt.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {appt.time}
                    </Badge>
                  </div>

                  {/* Informações de Serviço e Profissional */}
                  <div className="space-y-2 mb-4 bg-muted/30 p-3 rounded-2xl border border-border/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-semibold">Serviço:</span>
                      <span className="font-bold text-foreground truncate max-w-[65%] text-right">
                        {appt.snapshot_service_name || appt.service}
                      </span>
                    </div>

                    {appt.professionalName && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-semibold">Profissional:</span>
                        <span className="font-bold text-foreground">
                          {appt.professionalName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        Espera:
                      </span>
                      <span className="font-black text-purple-700 dark:text-purple-300">
                        {waitingTimeStr}
                      </span>
                    </div>
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="mb-5 flex flex-wrap gap-1.5 items-center">
                    {isPackage ? (
                      <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 font-bold text-xs py-0.5">
                        Pacote{" "}
                        {appt.session_number
                          ? `(Sessão ${appt.session_number})`
                          : appt.package
                            ? `(${appt.package.used_sessions + 1}/${appt.package.total_sessions})`
                            : ""}
                      </Badge>
                    ) : depositPaid > 0 ? (
                      <>
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold text-xs py-0.5">
                          Sinal R$ {depositPaid.toFixed(2)} pago
                        </Badge>
                        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-bold text-xs py-0.5">
                          A receber: R$ {remainingPrice.toFixed(2)}
                        </Badge>
                      </>
                    ) : appt.hasCharge ? (
                      <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-bold text-xs py-0.5">
                        A receber: R$ {rawPrice.toFixed(2)}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold text-xs py-0.5">
                        Pago
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    onClick={() => onAppointmentClick(appt)}
                    className="w-full h-10 rounded-xl font-bold text-xs border-border/60 hover:bg-muted"
                  >
                    Ver Detalhes
                  </Button>

                  <Button
                    onClick={() => handleComplete(appt)}
                    disabled={completingId === appt.id}
                    className="w-full h-10 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{completingId === appt.id ? "Concluindo..." : "Concluir"}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
