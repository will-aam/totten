// app/admin/reminders/page.tsx
"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, MessageCircle, CalendarCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Reminder {
  id: string;
  time: string;
  clientName: string;
  phone: string;
  serviceName: string;
  status: string;
}

export default function RemindersPage() {
  // 🔥 OTIMIZAÇÃO DE RENDERIZAÇÃO: Calcula as datas de forma síncrona com useMemo
  // Em vez de esperar o componente nascer, renderizar e depois acionar o useEffect,
  // calculamos imediatamente. O SWR não vai mais esperar para disparar!
  const { dateQuery, formattedDate } = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");

    return {
      dateQuery: `${yyyy}-${mm}-${dd}`,
      formattedDate: tomorrow.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
    };
  }, []);

  const { data, isLoading } = useSWR<{ appointments: Reminder[] }>(
    `/api/admin/reminders?date=${dateQuery}`,
    fetcher,
  );

  const [messagedIds, setMessagedIds] = useState<Set<string>>(new Set());

  const handleSendWhatsApp = (appt: Reminder) => {
    const cleanPhone = appt.phone.replace(/\D/g, "");
    const firstName = appt.clientName.split(" ")[0];

    const msg = `Olá ${firstName}! Passando para confirmar o seu horário amanhã às *${appt.time}* para o serviço de ${appt.serviceName}. Podemos confirmar? 🥰`;

    setMessagedIds((prev) => new Set(prev).add(appt.id));
    window.open(
      `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  return (
    <>
      <AdminHeader title="Confirmações e Lembretes" />

      {/* 🔥 PADRÃO DE LARGURA: max-w-400 e min-h ajustado */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-12 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        {/* Cabeçalho da Seção (Solto) */}
        <div className="flex flex-col gap-1 border-b border-border/40 pb-6">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Agenda de Amanhã
          </h2>
          <p className="text-sm font-medium text-muted-foreground capitalize">
            {formattedDate}
          </p>
        </div>

        {/* Título de Seção "Solto" na tela */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Para Confirmar
          </h2>
          {!isLoading && data?.appointments && (
            <span className="text-[11px] font-bold bg-muted/60 text-muted-foreground px-3 py-1.5 rounded-full uppercase tracking-wider">
              {data.appointments.length}{" "}
              {data.appointments.length === 1 ? "Cliente" : "Clientes"}
            </span>
          )}
        </div>

        {/* Container Principal Livre */}
        <div className="flex flex-col w-full">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="h-24 w-full rounded-3xl bg-muted/50 border border-border/50"
                />
              ))}
            </div>
          ) : !data?.appointments || data.appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-4xl border border-dashed border-border/60 shadow-sm mt-2">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Agenda livre
              </h3>
              <p className="text-sm font-medium text-muted-foreground max-w-sm mt-1 px-4">
                Não há nenhum agendamento pendente ou confirmado para o dia de
                amanhã.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {data.appointments.map((appt, index) => {
                const isConfirmed = appt.status === "CONFIRMADO";
                const hasMessaged = messagedIds.has(appt.id);

                return (
                  <div
                    key={appt.id}
                    className={cn(
                      "flex flex-col md:flex-row md:items-center justify-between p-5 rounded-3xl border transition-all gap-4 shadow-sm animate-in slide-in-from-bottom-2",
                      isConfirmed
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-card border-border/50 hover:border-primary/40 hover:shadow-md",
                    )}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {/* Infos (Esquerda) */}
                    <div className="flex items-center gap-4">
                      {/* Bolinha do Horário */}
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center h-14 w-14 rounded-2xl font-bold shrink-0",
                          isConfirmed
                            ? "bg-emerald-500/20 text-emerald-700"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <span className="leading-none text-[15px] mt-0.5">
                          {appt.time}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-base md:text-lg flex items-center gap-2 text-foreground leading-tight">
                          {appt.clientName}
                          {isConfirmed && (
                            <span
                              title="Já confirmado na agenda"
                              className="flex"
                            >
                              <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                            </span>
                          )}
                        </span>
                        <span className="text-xs md:text-sm text-muted-foreground font-medium mt-0.5">
                          {appt.serviceName}
                        </span>
                      </div>
                    </div>

                    {/* Botão Whatsapp (Direita) */}
                    <div className="flex justify-end w-full md:w-auto border-t md:border-none border-border/40 pt-4 md:pt-0">
                      <Button
                        onClick={() => handleSendWhatsApp(appt)}
                        variant={hasMessaged ? "secondary" : "default"}
                        className={cn(
                          "w-full md:w-auto rounded-2xl h-11 px-5 shrink-0 transition-all font-bold text-sm over:bg-transparent active:scale-90 active:brightness-90",
                        )}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {hasMessaged
                          ? "Mensagem Enviada"
                          : isConfirmed
                            ? "Reenviar Lembrete"
                            : "Confirmar Presença"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
