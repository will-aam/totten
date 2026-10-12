// app/(private)/admin/finance/_components/closing-report-modal.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send, Loader2, Calendar, Mail, CheckCircle2 } from "lucide-react";
import {
  getClosingReportAvailablePeriods,
  sendMonthlyReport,
} from "@/app/actions/reports";

interface ClosingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function ClosingReportModal({
  isOpen,
  onClose,
}: ClosingReportModalProps) {
  const { toast } = useToast();

  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonthsByYear, setAvailableMonthsByYear] = useState<
    Record<number, number[]>
  >({});

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [emailTo, setEmailTo] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingPeriods(true);

    getClosingReportAvailablePeriods()
      .then((res) => {
        if (!isMounted) return;

        const years = res.availableYears || [];
        const monthsByYear = res.availableMonthsByYear || {};

        setAvailableYears(years);
        setAvailableMonthsByYear(monthsByYear);

        if (res.defaultEmail && !emailTo) {
          setEmailTo(res.defaultEmail);
        }

        if (years.length > 0) {
          const initialYear = years[0];
          setSelectedYear(initialYear);

          const monthsForYear = monthsByYear[initialYear] || [];
          if (monthsForYear.length > 0) {
            setSelectedMonth(monthsForYear[monthsForYear.length - 1]);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPeriods(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Ao trocar de ano, seleciona o último mês disponível daquele ano
  const handleYearChange = (yearStr: string) => {
    const year = Number(yearStr);
    setSelectedYear(year);

    const monthsForYear = availableMonthsByYear[year] || [];
    if (monthsForYear.length > 0) {
      if (!selectedMonth || !monthsForYear.includes(selectedMonth)) {
        setSelectedMonth(monthsForYear[monthsForYear.length - 1]);
      }
    } else {
      setSelectedMonth(null);
    }
  };

  const currentAvailableMonths =
    selectedYear && availableMonthsByYear[selectedYear]
      ? ALL_MONTHS.filter((m) =>
        availableMonthsByYear[selectedYear].includes(m.value),
      )
      : [];

  const handleSend = async () => {
    if (!selectedYear || !selectedMonth) {
      toast({
        title: "Período obrigatório",
        description: "Selecione o mês e o ano para o fechamento.",
        variant: "destructive",
      });
      return;
    }

    if (!emailTo || !emailTo.includes("@")) {
      toast({
        title: "E-mail inválido",
        description: "Informe um e-mail válido para receber o fechamento.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const res = await sendMonthlyReport(selectedMonth, selectedYear, emailTo);
      if (res.success) {
        const monthLabel =
          ALL_MONTHS.find((m) => m.value === selectedMonth)?.label ||
          selectedMonth;
        toast({
          title: "Fechamento enviado com sucesso! 📊",
          description: `O relatório de ${monthLabel}/${selectedYear} foi enviado para ${emailTo}.`,
        });
        onClose();
      } else {
        toast({
          title: "Falha no envio",
          description:
            res.error || "Não foi possível enviar o e-mail de fechamento.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar o fechamento.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 border-border/60 shadow-2xl backdrop-blur-xl bg-background/95">
        <DialogHeader className="gap-1.5 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2.5">

            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-foreground">
                Exportar Fechamento
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Gere o resumo de receitas e despesas para envio por e-mail.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoadingPeriods ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              Carregando períodos disponíveis...
            </span>
          </div>
        ) : availableYears.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Nenhum dado financeiro registrado para exportação.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Seleção de Ano e Mês */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Período do Fechamento
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Select de Ano */}
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Ano
                  </span>
                  <Select
                    value={selectedYear?.toString() || ""}
                    onValueChange={handleYearChange}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/40 font-semibold focus:ring-primary/20">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-xl">
                      {availableYears.map((year) => (
                        <SelectItem
                          key={year}
                          value={year.toString()}
                          className="font-semibold rounded-lg"
                        >
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Select de Mês (apenas meses com dados no ano) */}
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Mês
                  </span>
                  <Select
                    value={selectedMonth?.toString() || ""}
                    onValueChange={(val) => setSelectedMonth(Number(val))}
                    disabled={currentAvailableMonths.length === 0}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/40 font-semibold focus:ring-primary/20">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-xl">
                      {currentAvailableMonths.map((m) => (
                        <SelectItem
                          key={m.value}
                          value={m.value.toString()}
                          className="font-semibold rounded-lg"
                        >
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/80">
                Apenas meses já encerrados que possuem dados registrados são exibidos.
              </p>
            </div>

            {/* E-mail de Destino */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                E-mail de Destino
              </Label>
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="h-11 rounded-xl bg-muted/40 border-border/40 font-semibold focus-visible:ring-primary/20 text-sm"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSending}
            className="rounded-xl font-bold h-11"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending || isLoadingPeriods || !selectedMonth || !selectedYear}
            className="rounded-xl font-bold h-11 px-5 shadow-lg active:scale-95 transition-all gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar Fechamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
