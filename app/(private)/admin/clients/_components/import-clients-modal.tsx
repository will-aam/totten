"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Table,
  CheckCircle,
  LoaderDots,
  ChevronRight,
  ClockDashedHalf,
  ArrowUpSquare,
  ArrowDownSquare,
} from "@boxicons/react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

const DB_FIELDS = [
  { key: "name", label: "Nome Completo", required: true },
  { key: "phone_whatsapp", label: "WhatsApp", required: true },
  { key: "cpf", label: "CPF", required: false },
  { key: "birth_date", label: "Nascimento", required: false },
  { key: "email", label: "E-mail", required: false },
  { key: "zip_code", label: "CEP", required: false },
  { key: "city", label: "Cidade", required: false },
  { key: "street", label: "Rua / Logradouro", required: false },
  { key: "number", label: "Número", required: false },
];

const COOLDOWN_MINUTES = 3;

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportClientsResponse {
  imported: number;
  skipped: number;
}

export function ImportClientsModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportClientsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const checkCooldown = () => {
      const lastImport = localStorage.getItem("totten_last_import");
      if (lastImport) {
        const timePassed = Date.now() - parseInt(lastImport, 10);
        const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
        if (timePassed < cooldownMs) {
          setCooldownRemaining(Math.ceil((cooldownMs - timePassed) / 1000));
        } else {
          setCooldownRemaining(0);
          localStorage.removeItem("totten_last_import");
        }
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClose = () => {
    setStep(1);
    setFileName("");
    setExcelHeaders([]);
    setExcelData([]);
    setMapping({});
    onClose();
  };

  const handleDownloadTemplate = () => {
    try {
      const headers = DB_FIELDS.map((f) => f.label);
      const exampleRow = [
        "Maria da Silva (Obrigatório)",
        "000.000.000-00 (Opcional)",
        "(11) 99999-9999 (Obrigatório)",
        "10/05/1990",
        "maria@email.com",
        "00000-000",
        "São Paulo - SP",
        "Avenida Paulista",
        "1000",
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Modelo_Clientes");
      XLSX.writeFile(wb, "Modelo_Importacao_Totten.xlsx");
      toast.success("Planilha modelo baixada!");
    } catch {
      toast.error("Erro ao gerar a planilha modelo.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", raw: false });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (data.length === 0) {
          toast.error("A planilha parece estar vazia.");
          setLoading(false);
          return;
        }

        if (data.length > 1000) {
          toast.error(
            "Por motivos de segurança, o limite é de 1000 clientes por arquivo.",
          );
          setLoading(false);
          return;
        }

        const headers = Object.keys(data[0] as object);
        setExcelHeaders(headers);
        setExcelData(data);

        const autoMap: Record<string, string> = {};
        DB_FIELDS.forEach((field) => {
          const match = headers.find(
            (h) =>
              h.toLowerCase().includes(field.label.toLowerCase()) ||
              h.toLowerCase().includes(field.key.toLowerCase()) ||
              (field.key === "cpf" && h.toLowerCase().includes("rg")),
          );
          if (match) autoMap[field.key] = match;
        });

        setMapping(autoMap);
        setStep(2);
      } catch {
        toast.error("Erro ao ler a planilha. Verifique o formato.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateMapping = () => {
    const missing = DB_FIELDS.filter((f) => f.required && !mapping[f.key]);
    if (missing.length > 0) {
      toast.error(
        `Falta mapear os campos obrigatórios: ${missing.map((m) => m.label).join(", ")}`,
      );
      return false;
    }
    return true;
  };

  const handleImport = async () => {
    if (!validateMapping()) return;
    setLoading(true);

    try {
      const clientsToImport = excelData.map((row) => {
        const client: Record<string, any> = {};
        DB_FIELDS.forEach((field) => {
          const excelColumnName = mapping[field.key];
          if (excelColumnName && row[excelColumnName]) {
            client[field.key] = String(row[excelColumnName]).trim();
          }
        });
        return client;
      });

      const result = await apiClient<ImportClientsResponse>("clients/import", {
        method: "POST",
        body: JSON.stringify({ clients: clientsToImport }),
      });

      toast.success(`${result.imported} clientes importados com sucesso!`);
      if (result.skipped > 0) {
        toast.info(`${result.skipped} ignorados (CPF já cadastrado).`);
      }
      localStorage.setItem("totten_last_import", Date.now().toString());
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao importar clientes");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-150 bg-card p-0 overflow-hidden border-border/50">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/10">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Table size="sm" className="text-primary" />
            Importar Planilha de Clientes
          </DialogTitle>
          <DialogDescription>
            {cooldownRemaining > 0
              ? "Por questões de segurança, aguarde o tempo de processamento."
              : step === 1
                ? "Envie seu arquivo CSV ou Excel (.xlsx, .xls) para importar clientes em lote."
                : `Mapeie as colunas do seu arquivo "${fileName}" para os dados do Totten.`}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {/* TELA DE COOLDOWN */}
          {cooldownRemaining > 0 ? (
            <div className="flex flex-col items-center justify-center border border-border rounded-xl p-10 bg-muted/10 animate-in zoom-in-95 duration-300">
              <div className="h-16 w-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4 relative">
                <ClockDashedHalf size="md" className="animate-pulse" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">
                Processando Lote Anterior
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-70 mb-6">
                Para garantir a estabilidade do banco de dados, aguarde o tempo
                abaixo antes de enviar uma nova planilha.
              </p>
              <div className="text-3xl font-black text-foreground tracking-widest bg-background px-6 py-3 rounded-lg border shadow-sm">
                {formatTime(cooldownRemaining)}
              </div>
            </div>
          ) : step === 1 ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-10 bg-muted/5 transition-all hover:bg-muted/20">
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/plain"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                {loading ? (
                  <LoaderDots size="md" className="animate-spin" />
                ) : (
                  <ArrowUpSquare size="md" />
                )}
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">
                Selecionar Planilha
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-62.5 mb-6">
                Aceitamos arquivos CSV, TXT e Excel (Máx: 1000 linhas).
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  disabled={loading}
                  className="rounded-xl px-6 h-11 border-border/60 shadow-sm"
                >
                  <ArrowDownSquare
                    size="sm"
                    className="mr-2 text-muted-foreground"
                  />
                  Baixar Modelo
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="rounded-xl px-8 h-11 shadow-sm"
                >
                  Procurar Arquivo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-primary flex items-center gap-2">
                  <CheckCircle size="sm" /> {excelData.length} linhas
                  encontradas
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Trocar Arquivo
                </Button>
              </div>

              <div className="max-h-[40vh] overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
                {DB_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 border border-border/50 rounded-xl"
                  >
                    <div className="flex flex-col">
                      <Label className="font-bold flex items-center gap-2 text-foreground">
                        {field.label}
                        {field.required && (
                          <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                            Obrigatório
                          </span>
                        )}
                      </Label>
                    </div>
                    <ChevronRight
                      size="sm"
                      className="hidden sm:block text-muted-foreground/40 shrink-0"
                    />
                    <Select
                      value={mapping[field.key] || "nao_importar"}
                      onValueChange={(val) =>
                        setMapping({
                          ...mapping,
                          [field.key]: val === "nao_importar" ? "" : val,
                        })
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full sm:w-55 h-10 rounded-lg",
                          !mapping[field.key] && field.required
                            ? "border-red-400 focus:ring-red-400"
                            : "",
                        )}
                      >
                        <SelectValue placeholder="Selecione a coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="nao_importar"
                          className="text-muted-foreground italic"
                        >
                          Não importar este dado
                        </SelectItem>
                        {excelHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {step === 2 && cooldownRemaining === 0 && (
          <div className="p-6 pt-0 flex justify-end gap-3 bg-card border-t border-border/50 mt-2 py-4">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading}
              className="rounded-xl font-bold px-8 shadow-md"
            >
              {loading ? (
                <>
                  <LoaderDots size="sm" className="animate-spin mr-2" />{" "}
                  Importando...
                </>
              ) : (
                "Iniciar Importação"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
