// app/totem/check-in/totem-check-in-content.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // 🔥 Importamos a sessão
import { CpfKeypad } from "@/components/cpf-keypad";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type AppointmentOption = {
  id: string;
  service_name: string;
  date_time: string;
};

type SearchResponse =
  | {
      status: "FOUND";
      appointment: {
        id: string;
        date_time: string;
        service_name: string;
        client_name: string;
        package_info?: { used: number; total: number } | null;
      };
    }
  | {
      status: "NOT_FOUND";
    }
  | {
      status: "MULTIPLE_FOUND";
      clientName: string;
      appointments: AppointmentOption[];
    };

export default function TotemCheckInContent() {
  const router = useRouter();
  const { status } = useSession(); // 🔥 Obtemos o status da sessão

  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  const [multipleAppointments, setMultipleAppointments] = useState<
    AppointmentOption[]
  >([]);
  const [clientName, setClientName] = useState<string | null>(null);
  const [showSelection, setShowSelection] = useState(false);

  const [pendingAppointment, setPendingAppointment] =
    useState<AppointmentOption | null>(null);
  const [showConfirmTime, setShowConfirmTime] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // 🔥 Nova Lógica de Proteção: Usa a sessão em vez do slug
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/totem/error?type=ORG_NOT_FOUND");
    }
  }, [status, router]);

  const handleConfirm = async () => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return;

    setLoading(true);
    try {
      const res = await fetch("/api/totem/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: digits,
          // 🔥 Não enviamos mais o slug
        }),
      });

      const data: SearchResponse = await res.json();

      if (data.status === "NOT_FOUND") {
        router.push(`/totem/error?type=CPF_NOT_FOUND`);
        return;
      }

      if (data.status === "FOUND") {
        const params = new URLSearchParams({
          name: data.appointment.client_name,
          service: data.appointment.service_name,
          time: new Date(data.appointment.date_time).toLocaleTimeString(
            "pt-BR",
            { hour: "2-digit", minute: "2-digit" },
          ),
        });

        if (data.appointment.package_info) {
          params.append("used", data.appointment.package_info.used.toString());
          params.append(
            "total",
            data.appointment.package_info.total.toString(),
          );
        }

        router.push(`/totem/success?${params.toString()}`);
        return;
      }

      if (data.status === "MULTIPLE_FOUND") {
        setClientName(data.clientName);
        setMultipleAppointments(data.appointments);
        setShowSelection(true);
        return;
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      router.push(`/totem/error?type=UNKNOWN`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAppointment = (appt: AppointmentOption) => {
    const now = new Date();
    const apptTime = new Date(appt.date_time);
    const diffMinutes = Math.abs((now.getTime() - apptTime.getTime()) / 60000);

    if (diffMinutes > 60) {
      setPendingAppointment(appt);
      setShowConfirmTime(true);
      return;
    }

    handleCheckIn(appt);
  };

  const handleCheckIn = async (appt: AppointmentOption) => {
    setCheckingIn(true);
    try {
      const res = await fetch("/api/totem/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appt.id,
          // 🔥 Não enviamos mais o slug
        }),
      });

      const data = await res.json();

      if (data.success) {
        const params = new URLSearchParams({
          name: data.clientName,
          service: data.serviceName,
          time: data.time,
        });

        if (data.package_info) {
          params.append("used", data.package_info.used.toString());
          params.append("total", data.package_info.total.toString());
        }

        router.push(`/totem/success?${params.toString()}`);
      } else {
        router.push(`/totem/error?type=UNKNOWN`);
      }
    } catch (error) {
      console.error("Erro ao fazer check-in:", error);
      router.push(`/totem/error?type=UNKNOWN`);
    } finally {
      setCheckingIn(false);
    }
  };

  // Se a sessão estiver carregando, mostra uma tela vazia para evitar piscar o componente
  if (status === "loading") {
    return <div className="min-h-svh bg-background" />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-background p-4 sm:p-8">
      <Link
        href="/totem/idle" // 🔥 URL limpa
        className="absolute top-4 left-4 sm:static sm:self-start flex w-fit items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group z-10"
      >
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-transparent sm:bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </div>
        <span className="hidden sm:inline font-medium">Voltar</span>
      </Link>

      <div className="flex flex-1 items-center justify-center w-full mt-16 sm:mt-0">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <div className="text-center">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-3">
              Check-in
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Digite seu CPF para registrar sua presença
            </p>
          </div>

          <div className="w-full">
            <CpfKeypad
              value={cpf}
              onChange={setCpf}
              onConfirm={handleConfirm}
              disabled={loading}
            />
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm font-medium text-primary mt-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verificando agendamentos...</span>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showSelection} onOpenChange={setShowSelection}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-serif">
              Olá, {clientName}!
            </DialogTitle>
            <p className="text-base text-muted-foreground text-center mt-2">
              Qual procedimento vamos fazer agora?
            </p>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            {multipleAppointments.map((appt) => (
              <Button
                key={appt.id}
                onClick={() => handleSelectAppointment(appt)}
                disabled={checkingIn}
                variant="outline"
                className="h-auto py-5 px-5 flex flex-col items-start gap-2 hover:border-primary rounded-2xl"
              >
                <span className="font-semibold text-base text-left">
                  {appt.service_name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(appt.date_time).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmTime} onOpenChange={setShowConfirmTime}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-serif">
              Confirmar horário
            </DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Este serviço está agendado para{" "}
              <strong className="text-foreground font-bold">
                {pendingAppointment
                  ? new Date(pendingAppointment.date_time).toLocaleTimeString(
                      "pt-BR",
                      { hour: "2-digit", minute: "2-digit" },
                    )
                  : "--:--"}
              </strong>
              . Deseja fazer o check-in antecipado?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 rounded-xl text-base font-semibold"
              onClick={() => setShowConfirmTime(false)}
            >
              Voltar
            </Button>
            <Button
              size="lg"
              className="w-full h-14 rounded-xl text-base font-semibold"
              onClick={() =>
                pendingAppointment && handleCheckIn(pendingAppointment)
              }
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
