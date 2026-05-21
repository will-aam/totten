// components/client/package-voucher.tsx
"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowToBottom, Share, BadgeCheck, LoaderDots } from "@boxicons/react";
import { toast } from "sonner";

interface PackageVoucherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  clientName: string;
  packageName: string;
  totalSessions: number;
  // Nova prop para receber o array de datas
  sessionDates?: string[] | Date[]; 
}

export function PackageVoucher({
  open,
  onOpenChange,
  packageId,
  clientName,
  packageName,
  totalSessions,
  sessionDates = [], // Valor default vazio
}: PackageVoucherProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const registerVoucher = async () => {
    try {
      await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: packageId }),
      });
    } catch (error) {
      console.error("Erro ao registrar voucher:", error);
    }
  };

  const handleExport = async (action: "download" | "share") => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      const width = cardRef.current.offsetWidth;
      const height = cardRef.current.offsetHeight;

      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor:
          getComputedStyle(document.documentElement)
            .getPropertyValue("--background")
            .trim() || "#ffffff",
        width: width,
        height: height,
        style: {
          margin: "0",
          transform: "none",
        },
      });

      if (action === "download") {
        const link = document.createElement("a");
        link.download = `Comprovante_${clientName.replace(/\s+/g, "_")}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Comprovante baixado com sucesso!");
        await registerVoucher();
      }

      if (action === "share") {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "comprovante.png", { type: blob.type });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Pacote Concluído - Totten",
            text: `Parabéns ${clientName.split(" ")[0]}! Você concluiu seu pacote conosco. 💆‍♀️✨`,
            files: [file],
          });
          await registerVoucher();
        } else {
          handleExport("download");
          toast.info("Compartilhamento não suportado. O arquivo foi baixado.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar o comprovante.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-background p-4 sm:p-6 rounded-3xl overflow-y-auto max-h-[90dvh] border-border">
        <DialogTitle className="sr-only">Comprovante de Conclusão</DialogTitle>

        <div className="flex flex-col items-center justify-center py-2 sm:py-4 w-full overflow-hidden">
          <div
            ref={cardRef}
            className="w-72 bg-card p-5 flex flex-col items-center text-center relative overflow-hidden shrink-0"
          >
            {/* Decorações de Fundo */}
            <div className="absolute -top-10 -right-10 text-muted/20 pointer-events-none">
              <BadgeCheck className="h-32 w-32 fill-current" />
            </div>
            <div className="absolute -bottom-10 -left-10 text-muted/10 pointer-events-none rotate-180">
              <BadgeCheck className="h-24 w-24 fill-current" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted/5 pointer-events-none">
              <BadgeCheck className="h-40 w-40" />
            </div>

            {/* Conteúdo */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mb-3 z-10 shrink-0">
              <BadgeCheck className="h-6 w-6" />
            </div>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-1 z-10 leading-tight">
              Parabéns!
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-4 z-10">
              Pacote Concluído
            </p>

            <div className="w-full h-px bg-border mb-4 z-10" />

            <div className="flex flex-col gap-1 w-full z-10">
              <p className="text-xs text-muted-foreground">Certificamos que</p>
              <p className="text-lg font-bold text-foreground leading-tight">
                {clientName}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                finalizou com sucesso o
              </p>
              <p className="text-sm font-semibold text-foreground leading-snug px-2">
                {packageName}
              </p>

              <div className="mt-4 inline-flex mx-auto items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium">
                {totalSessions} / {totalSessions} Sessões
              </div>
            </div>

            {/* --- NOVO: HISTÓRICO DE SESSÕES --- */}
            {sessionDates.length > 0 && (
              <div className="mt-5 w-full z-10 flex flex-col items-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">
                  Histórico de Uso
                </p>
                {/* Grid 2 colunas: perfeito para a largura w-72 */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 w-full px-1">
                  {sessionDates.map((date, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center text-[10px] bg-muted/40 rounded px-2 py-1"
                    >
                      <span className="font-bold text-muted-foreground mr-2">{index + 1}º</span>
                      <span className="text-foreground font-medium truncate">
                        {new Date(date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit" // Usa formato curto dd/mm/aa para economizar espaço
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* ----------------------------------- */}

            {/* Footer */}
            <div className="mt-6 pt-3 w-full border-t border-dashed border-border z-10 flex justify-between items-center px-1">
              <span className="font-serif font-bold text-foreground text-sm">
                Totten
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {new Date().toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-2 w-full mt-2">
          <Button
            onClick={() => handleExport("share")}
            disabled={isExporting}
            className="w-full rounded-full h-10 text-xs sm:text-sm active:scale-95 transition-transform"
          >
            {isExporting ? <LoaderDots className="mr-2 h-4 w-4 animate-spin" /> : <Share className="mr-2 h-4 w-4" />}
            Compartilhar via WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("download")}
            disabled={isExporting}
            className="w-full rounded-full border-border hover:bg-muted active:scale-95 transition-transform h-10 text-xs sm:text-sm"
          >
            {isExporting ? <LoaderDots className="mr-2 h-4 w-4 animate-spin" /> : <ArrowToBottom className="mr-2 h-4 w-4" />}
            Baixar Imagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
