"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Clock,
  CalendarDays,
  User,
  Repeat,
  CalendarX2,
  CalendarClock,
  ReceiptText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppointmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any | null;
}

export function AppointmentDetailsModal({
  open,
  onOpenChange,
  appointment,
}: AppointmentDetailsModalProps) {
  const [status, setStatus] = useState("a_confirmar");
  const [payment, setPayment] = useState("nenhum");
  const [obs, setObs] = useState("");
  const [hasCharge, setHasCharge] = useState(false);

  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status || "a_confirmar");
      setPayment(appointment.payment || "nenhum");
      setObs(appointment.obs || "");
      setHasCharge(appointment.hasCharge || false);
    }
  }, [appointment]);

  if (!appointment) return null;

  const formatTime = (dt?: string | Date | null) => {
    if (!dt) return null;
    const date = typeof dt === "string" ? new Date(dt) : dt;
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m + duration);
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const getCheckInDiff = () => {
    if (!appointment.checkInTime) return null;

    const checkInDate = new Date(appointment.checkInTime);
    const [h, m] = appointment.time.split(":").map(Number);

    // Usa a data do check-in para compor o horário agendado do mesmo dia
    const scheduled = new Date(checkInDate);
    scheduled.setHours(h, m, 0, 0);

    const diffMinutes = Math.round(
      (checkInDate.getTime() - scheduled.getTime()) / 60000,
    );

    const abs = Math.abs(diffMinutes);

    if (abs <= 5) {
      return {
        label: "No horário",
        minutes: 0,
        variant: "secondary" as const,
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    }

    if (diffMinutes < 0) {
      return {
        label: "Antecipado",
        minutes: abs,
        variant: "secondary" as const,
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
    }

    return {
      label: "Atrasado",
      minutes: abs,
      variant: "secondary" as const,
      className: "bg-rose-100 text-rose-700 border-rose-200",
    };
  };

  const checkInDiff = getCheckInDiff();

  const handleWhatsApp = () => {
    const firstName = appointment.clientName.split(" ")[0];
    const isLastSession = appointment.sessionInfo?.match(/Sessão (\d+) de \1/i);
    const message = isLastSession
      ? `Olá ${firstName}! 🎉 Passando para lembrar que hoje às ${appointment.time} temos a nossa última massagem do pacote! Te espero lá. 💆‍♀️✨`
      : `Olá ${firstName}! Passando para confirmar nossa sessão amanhã às ${appointment.time}. Podemos confirmar? 💆‍♀️✨`;

    window.open(
      `https://wa.me/${appointment.phone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
    toast.success("Abrindo o WhatsApp...");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[95vw] sm:max-w-125 p-4 sm:p-6 rounded-2xl transition-colors duration-300 flex flex-col max-h-[90dvh]",
          hasCharge
            ? "border-2 border-destructive shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            : "",
        )}
      >
        <DialogHeader className="mb-1 shrink-0 text-left">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-lg sm:text-xl font-bold flex flex-wrap items-center gap-2">
              <User className="h-5 w-5 text-primary hidden sm:block" />
              {appointment.clientName}
              {hasCharge && (
                <Badge
                  variant="destructive"
                  className="text-[10px] animate-pulse py-0 h-5"
                >
                  Pendente
                </Badge>
              )}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-medium text-xs sm:text-sm">
                {appointment.service}
              </span>
              {appointment.isRecurring && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 h-5 text-[9px] sm:text-[10px] py-0"
                >
                  <Repeat className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Pacote
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 overflow-y-auto px-1 -mx-1 [&::-webkit-scrollbar]:hidden min-h-0">
          <div className="bg-muted/30 border border-border/50 rounded-xl p-3 flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Hoje</span>
              </div>
              <Badge
                variant="outline"
                className="font-bold bg-background text-[10px] sm:text-xs"
              >
                {appointment.sessionInfo}
              </Badge>
            </div>

            <div className="flex flex-col gap-1 text-sm text-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">
                  {appointment.time} até{" "}
                  {calculateEndTime(appointment.time, appointment.duration)}
                  <span className="text-muted-foreground font-normal ml-1">
                    ({appointment.duration} min)
                  </span>
                </span>
              </span>

              {appointment.checkInTime && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  Check-in realizado às{" "}
                  <strong className="text-foreground">
                    {formatTime(appointment.checkInTime)}
                  </strong>
                  {checkInDiff && (
                    <Badge
                      variant={checkInDiff.variant}
                      className={cn(
                        "ml-2 text-[10px] border",
                        checkInDiff.className,
                      )}
                    >
                      {checkInDiff.label}
                      {checkInDiff.minutes > 0
                        ? ` • ${checkInDiff.minutes} min`
                        : ""}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Status do Agendamento
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  className={cn(
                    "h-10 sm:h-9 text-sm",
                    status === "confirmado"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 font-semibold"
                      : "",
                  )}
                >
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  <SelectItem value="a_confirmar">A Confirmar</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="atrasou">Atrasou</SelectItem>
                  <SelectItem value="não_comparecimento">
                    Não Comparec.
                  </SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Forma de Pagamento
              </Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger className="h-10 sm:h-9 text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Não informado</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">
                    Cartão de Crédito
                  </SelectItem>
                  <SelectItem value="cartao_debito">
                    Cartão de Débito
                  </SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea
              placeholder="Ex: Alergia a óleo de amêndoas..."
              className="resize-none min-h-15 sm:min-h-20 bg-muted/20 text-sm"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:grid sm:grid-cols-2 gap-2 sm:gap-3 mt-1">
            <Button
              variant={hasCharge ? "destructive" : "outline"}
              className={cn(
                "w-full h-10 sm:h-11",
                !hasCharge &&
                  "border-dashed border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive",
              )}
              onClick={() => setHasCharge(!hasCharge)}
            >
              <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                {hasCharge ? "Remover Cobrança" : "Adicionar Cobrança"}
              </span>
            </Button>

            <Button
              variant="secondary"
              className="w-full h-10 sm:h-11 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <ReceiptText className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Gerar Recibo</span>
            </Button>
          </div>

          <Button
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm h-12 text-sm sm:text-base mt-2 shrink-0"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="mr-2 h-5 w-5 shrink-0" />
            Confirmar via WhatsApp
          </Button>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2 pt-4 border-t border-border/50 shrink-0">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            <CalendarX2 className="mr-2 h-4 w-4 shrink-0" /> Cancelar Sessão
          </Button>

          <Button
            variant="outline"
            className="w-full sm:w-auto h-11 sm:h-10"
            onClick={() => {
              toast.info("Modo de edição/remarcação ativado.");
              onOpenChange(false);
            }}
          >
            <CalendarClock className="mr-2 h-4 w-4 shrink-0" /> Remarcar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
