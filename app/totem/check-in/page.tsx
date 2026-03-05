"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function TotemCheckInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const organizationSlug =
    searchParams.get("slug") || searchParams.get("organization") || "";

  const handleConfirm = async () => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return;

    if (!organizationSlug) {
      router.push("/totem/error?type=ORG_NOT_FOUND");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/totem/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: digits,
          organizationSlug,
        }),
      });

      const data: SearchResponse = await res.json();

      if (data.status === "NOT_FOUND") {
        router.push("/totem/error?type=CPF_NOT_FOUND");
        return;
      }

      if (data.status === "FOUND") {
        const params = new URLSearchParams({
          name: data.appointment.client_name,
          service: data.appointment.service_name,
          time: new Date(data.appointment.date_time).toLocaleTimeString(
            "pt-BR",
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          ),
        });
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
      router.push("/totem/error?type=UNKNOWN");
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
        }),
      });

      const data = await res.json();

      if (data.success) {
        const params = new URLSearchParams({
          name: data.clientName,
          service: data.serviceName,
          time: data.time,
        });
        router.push(`/totem/success?${params.toString()}`);
      } else {
        router.push("/totem/error?type=UNKNOWN");
      }
    } catch (error) {
      console.error("Erro ao fazer check-in:", error);
      router.push("/totem/error?type=UNKNOWN");
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <>
      <div className="flex min-h-dvh w-full items-center justify-center bg-background p-4 sm:p-6 md:p-8">
        <div className="relative flex w-full max-w-lg flex-col items-center gap-8 rounded-3xl bg-card p-6 shadow-xl border border-border sm:p-10 md:p-12">
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
            <Link
              href={
                organizationSlug
                  ? `/totem/idle?slug=${organizationSlug}`
                  : "/totem/idle"
              }
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-[#D9C6BF]/30 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </div>
              <span className="hidden font-medium sm:inline">Voltar</span>
            </Link>
          </div>

          <div className="mt-12 text-center sm:mt-4">
            <h1 className="font-serif text-3xl font-bold text-foreground md:text-5xl">
              Check-in
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base leading-relaxed">
              Digite seu CPF para registrar sua presença
            </p>
          </div>

          <div className="w-full max-w-sm">
            <CpfKeypad
              value={cpf}
              onChange={setCpf}
              onConfirm={handleConfirm}
              disabled={loading}
            />
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando agendamentos...
            </div>
          )}
        </div>
      </div>

      <Dialog open={showSelection} onOpenChange={setShowSelection}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Olá, {clientName}!
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Qual procedimento vamos fazer agora?
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            {multipleAppointments.map((appt) => (
              <Button
                key={appt.id}
                onClick={() => handleSelectAppointment(appt)}
                disabled={checkingIn}
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-start gap-2 hover:border-primary hover:bg-primary/5"
              >
                <span className="font-semibold text-left">
                  {appt.service_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(appt.date_time).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </Button>
            ))}
          </div>

          {checkingIn && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Registrando check-in...
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmTime} onOpenChange={setShowConfirmTime}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Confirmar horário</DialogTitle>
            <DialogDescription className="text-center">
              Este serviço está agendado para{" "}
              <strong>
                {pendingAppointment
                  ? new Date(pendingAppointment.date_time).toLocaleTimeString(
                      "pt-BR",
                      { hour: "2-digit", minute: "2-digit" },
                    )
                  : "--:--"}
              </strong>
              . Deseja fazer o check-in antecipado agora?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowConfirmTime(false);
                setPendingAppointment(null);
              }}
            >
              Voltar
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                if (pendingAppointment) {
                  handleCheckIn(pendingAppointment);
                  setShowConfirmTime(false);
                  setPendingAppointment(null);
                }
              }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
