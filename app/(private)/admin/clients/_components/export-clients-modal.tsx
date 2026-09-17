"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { exportClientsAction } from "@/app/actions/clients";
import * as XLSX from "xlsx";
import { Download, Loader2, FileText, History } from "lucide-react";

interface ExportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportClientsModal({ isOpen, onClose }: ExportClientsModalProps) {
  const [exportType, setExportType] = useState<"cadastral" | "history">("cadastral");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const includeHistory = exportType === "history";
      
      const response = await exportClientsAction(includeHistory);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (!response.data || response.data.length === 0) {
        toast.warning("Nenhum dado encontrado para exportar.");
        return;
      }

      // Generate Excel/CSV
      const worksheet = XLSX.utils.json_to_sheet(response.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");

      const fileName = includeHistory 
        ? `clientes_e_historico_${new Date().getTime()}.xlsx` 
        : `clientes_cadastro_${new Date().getTime()}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success("Exportação concluída com sucesso!");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Ocorreu um erro ao exportar os dados.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Clientes</DialogTitle>
          <DialogDescription>
            Selecione o formato de dados que deseja baixar. O arquivo será salvo em Excel (.xlsx).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup 
            value={exportType} 
            onValueChange={(val) => setExportType(val as "cadastral" | "history")}
            className="flex flex-col gap-4"
          >
            <div className="flex items-start space-x-3 space-y-0 p-3 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setExportType("cadastral")}>
              <RadioGroupItem value="cadastral" id="cadastral" className="mt-1" />
              <div className="grid gap-1.5 cursor-pointer flex-1">
                <Label htmlFor="cadastral" className="font-semibold text-base cursor-pointer flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Apenas Dados Cadastrais
                </Label>
                <p className="text-sm text-muted-foreground leading-snug">
                  Exporta uma lista com os dados de contato, endereço e status de todos os clientes. Ideal para migrações básicas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0 p-3 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setExportType("history")}>
              <RadioGroupItem value="history" id="history" className="mt-1" />
              <div className="grid gap-1.5 cursor-pointer flex-1">
                <Label htmlFor="history" className="font-semibold text-base cursor-pointer flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-500" />
                  Ficha + Histórico/Jornada
                </Label>
                <p className="text-sm text-muted-foreground leading-snug">
                  Exporta uma lista detalhada de eventos, incluindo compras de pacotes, check-ins e faltas de cada cliente. 
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="min-w-[120px]">
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Baixando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
