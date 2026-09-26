"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowToBottom, Share, LoaderDots } from "@boxicons/react";
import { Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Reward {
  id: number | string;
  title: string;
  pointsCost: number;
}

interface LoyaltyVoucherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  points: number;
  rewards: Reward[];
}

export function LoyaltyVoucher({
  open,
  onOpenChange,
  clientName,
  points,
  rewards,
}: LoyaltyVoucherProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (action: "download" | "share") => {
    if (!cardRef.current) return;
    setIsExporting(true);

    // Aguardar o React aplicar as classes de exportação (remover bordas/recortes)
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const width = cardRef.current.offsetWidth;
      const height = cardRef.current.offsetHeight;
      const scale = 3;

      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: scale,
        width: width,
        height: height,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: "0",
          padding: "0",
        },
      });

      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const filename = `voucher-fidelidade-${clientName.replace(/\s+/g, "-").toLowerCase()}-${dateStr}.png`;

      if (action === "download") {
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
        toast.success("Voucher baixado com sucesso!");
      } else if (action === "share") {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Voucher Fidelidade - ${clientName}`,
            text: "Confira seu voucher do programa de fidelidade Totten!",
            files: [file],
          });
          toast.success("Pronto para compartilhar!");
        } else {
          toast.error("O compartilhamento não é suportado no seu dispositivo.");
        }
      }
    } catch (error) {
      console.error("Erro ao gerar voucher:", error);
      toast.error("Erro ao gerar voucher. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl bg-background p-4 sm:p-6 rounded-3xl overflow-y-auto max-h-[90dvh] border-border flex flex-col items-center">
        <DialogTitle className="sr-only">Voucher de Fidelidade</DialogTitle>

        <div className="w-full overflow-x-auto py-4 flex justify-center scrollbar-hide">
          {/* TICKET CONTAINER */}
          <div
            ref={cardRef}
            className={`flex shrink-0 relative bg-card text-card-foreground shadow-sm ${
              !isExporting ? "rounded-xl overflow-hidden" : ""
            }`}
            style={{ width: "600px", height: "300px" }}
          >
            {/* FAKE CUTOUTS (Instead of CSS Mask for better browser compatibility) */}
            {!isExporting && (
              <>
                <div className="absolute top-0 left-[430px] w-6 h-6 -mt-3 -ml-3 bg-background rounded-full border border-border/50 z-20" />
                <div className="absolute bottom-0 left-[430px] w-6 h-6 -mb-3 -ml-3 bg-background rounded-full border border-border/50 z-20" />
              </>
            )}

            {/* LEFT BODY */}
            <div className="w-[430px] h-full p-8 flex flex-col z-10 border-r border-dashed border-border/60">
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h1 className="font-bold text-xl tracking-wide font-philosopher text-foreground mb-1">
                    Totten Fidelidade
                  </h1>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">
                    Programa de Recompensas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1">
                    Cliente
                  </p>
                  <h2 className="text-foreground text-base font-bold truncate max-w-[150px]">
                    {clientName}
                  </h2>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-3">
                  Recompensas Disponíveis
                </p>
                <div className="flex flex-col gap-1.5">
                  {rewards.map((reward) => {
                    const isLocked = points < reward.pointsCost;
                    return (
                      <div 
                        key={reward.id} 
                        className={`flex items-center justify-between py-1 ${
                          isLocked ? "opacity-50 grayscale" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          {isLocked ? (
                            <Lock className="text-muted-foreground shrink-0" size={14} />
                          ) : (
                            <CheckCircle2 className="text-primary shrink-0" size={14} />
                          )}
                          <span className={`text-sm font-medium truncate ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                            {reward.title}
                          </span>
                        </div>
                        <span className={`text-sm font-bold whitespace-nowrap ${
                          isLocked ? "text-muted-foreground" : "text-primary"
                        }`}>
                          {reward.pointsCost} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT BODY (STUB) */}
            <div className="flex-1 h-full p-6 flex flex-col items-center justify-center text-center z-10 bg-muted/10">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">
                Saldo Atual
              </p>
              <h2 className="text-foreground text-6xl font-black tracking-tighter mb-1">
                {points}
              </h2>
              <p className="text-primary text-sm font-bold uppercase tracking-widest">
                Pontos
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 w-full max-w-md mt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-12 hover:bg-muted"
            onClick={() => handleExport("share")}
            disabled={isExporting}
          >
            {isExporting ? (
              <LoaderDots className="h-5 w-5 animate-spin" />
            ) : (
              <Share className="h-5 w-5 mr-2" />
            )}
            Compartilhar
          </Button>
          <Button
            className="flex-1 rounded-xl h-12 shadow-md hover:shadow-lg transition-all"
            onClick={() => handleExport("download")}
            disabled={isExporting}
          >
            {isExporting ? (
              <LoaderDots className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowToBottom className="h-5 w-5 mr-2" />
            )}
            Baixar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
