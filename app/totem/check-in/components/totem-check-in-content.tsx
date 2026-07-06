"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IdentificationKeypad, InputMode } from "./identification-keypad";
import { LoaderDots } from "@boxicons/react";
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
  const { status } = useSession();

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<InputMode>("CPF");

  const [multipleAppointments, setMultipleAppointments] = useState<
    AppointmentOption[]
  >([]);
  const [clientName, setClientName] = useState<string | null>(null);
  const [showSelection, setShowSelection] = useState(false);

  const [pendingAppointment, setPendingAppointment] =
    useState<AppointmentOption | null>(null);
  const [showConfirmTime, setShowConfirmTime] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // Proteção de rota baseada na sessão do Totem
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/totem/error?type=ORG_NOT_FOUND");
    }
  }, [status, router]);

  const handleConfirm = async (mode: InputMode) => {
    const digits = inputValue.replace(/\D/g, "");
    // Validação estrita: CPF precisa de 11 dígitos, Telefone aceita 10 ou 11
    if (mode === "CPF" && digits.length !== 11) return;
    if (mode === "PHONE" && digits.length < 10) return;

    setLoading(true);
    try {
      // Enviamos o valor limpo e o modo (CPF ou PHONE) para a API saber como buscar
      const res = await fetch("/api/totem/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: digits,
          mode: mode,
        }),
      });

      const data: SearchResponse = await res.json();

      if (data.status === "NOT_FOUND") {
        // Se não encontrar por Telefone, podemos usar um parâmetro genérico de erro no futuro
        router.push(`/totem/error?type=${mode}_NOT_FOUND`);
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

  if (status === "loading") {
    return <div className="h-full w-full bg-background" />;
  }

  return (
    <div className="flex w-full max-w-[90%] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl flex-col items-center gap-6 md:gap-10">
      {" "}
      <div className="w-full">
        <IdentificationKeypad
          value={inputValue}
          onChange={setInputValue}
          onConfirm={handleConfirm}
          disabled={loading}
          mode={mode} // Nova prop
          onModeChange={setMode} // Nova prop
        />
      </div>
      {/* Loader de verificação */}
      {loading && (
        <div className="flex items-center gap-2 text-sm font-medium text-primary mt-2 md:text-base">
          <LoaderDots className="h-5 w-5 animate-spin" />
          <span>Verificando agendamentos...</span>
        </div>
      )}
      {/* Modal: Múltiplos Agendamentos Encontrados */}
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
      {/* Modal: Confirmar Horário Antecipado/Atrasado */}
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
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
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
              disabled={checkingIn}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
