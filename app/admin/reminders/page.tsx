// app/admin/reminders/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  // 🔥 Lógica para calcular o "Amanhã" no fuso horário do usuário
  const [dateQuery, setDateQuery] = useState<string>("");
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");

    // Monta a data no formato YYYY-MM-DD para mandar pra API
    setDateQuery(`${yyyy}-${mm}-${dd}`);

    // Monta a data bonitinha pra exibir na tela
    setFormattedDate(
      tomorrow.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
    );
  }, []);

  // Só faz a requisição quando já tem a data calculada
  const { data, isLoading } = useSWR<{ appointments: Reminder[] }>(
    dateQuery ? `/api/admin/reminders?date=${dateQuery}` : null,
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

      {/* Espaçamento maximizado, sem cards */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 md:pb-6">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col gap-2 border-b border-border/50 pb-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Agenda de Amanhã
          </h2>
          <p className="text-sm text-muted-foreground capitalize font-medium">
            {!formattedDate ? "Carregando..." : formattedDate}
          </p>
        </div>

        {/* Título e Contador */}
        <div className="flex items-center gap-2 text-foreground font-semibold text-lg mt-2">
          <Bell className="h-5 w-5 text-primary" />
          Para Confirmar
          {!isLoading && data?.appointments && (
            <span className="ml-auto text-xs font-bold bg-primary/10 px-2.5 py-1 rounded-full text-primary">
              {data.appointments.length}{" "}
              {data.appointments.length === 1 ? "cliente" : "clientes"}
            </span>
          )}
        </div>

        {/* Container Principal Livre */}
        <div className="flex flex-col w-full">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : !data?.appointments || data.appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/20 rounded-3xl border border-dashed border-border/60 mt-4">
              <CalendarCheck className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                Agenda livre
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Não há nenhum agendamento pendente ou confirmado para o dia de
                amanhã.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.appointments.map((appt) => {
                const isConfirmed = appt.status === "CONFIRMADO";
                const hasMessaged = messagedIds.has(appt.id);

                return (
                  <div
                    key={appt.id}
                    className={cn(
                      "flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-2xl border transition-all gap-4 shadow-sm",
                      isConfirmed
                        ? "bg-emerald-50/40 border-emerald-100"
                        : "bg-card hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Bolinha do Horário */}
                      <div className="flex flex-col items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        <span className="text-[10px] text-primary/70 uppercase -mb-0.5 tracking-wider font-bold">
                          Hora
                        </span>
                        <span className="leading-none text-base">
                          {appt.time}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-base md:text-lg flex items-center gap-2">
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
                        <span className="text-xs md:text-sm text-muted-foreground font-medium">
                          {appt.serviceName}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSendWhatsApp(appt)}
                      variant={hasMessaged ? "secondary" : "default"}
                      size="lg"
                      className={cn(
                        "w-full md:w-auto rounded-xl shrink-0 transition-all font-bold",
                        hasMessaged
                          ? "bg-muted text-muted-foreground"
                          : "bg-[#25D366] hover:bg-[#128C7E] text-white shadow-md hover:shadow-lg",
                      )}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      {hasMessaged
                        ? "Mensagem Enviada"
                        : isConfirmed
                          ? "Reenviar Lembrete"
                          : "Confirmar Presença"}
                    </Button>
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
