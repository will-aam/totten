"use client";

import { useState } from "react";
import { CheckCircle, Clock, AlertCircle, Copy, Check, Ticket } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface VoucherItem {
  id: string;
  pin?: string | null;
  title: string;
  points_spent: number;
  status: string;
  created_at: string | Date;
  expires_at?: string | Date | null;
  used_at?: string | Date | null;
  reward_type?: string | null;
  discount_value?: number | null;
}

export function ClientVoucherCard({ voucher }: { voucher: VoucherItem }) {
  const [copied, setCopied] = useState(false);

  const isUsed = voucher.status === "UTILIZADO";
  const isExpired = !isUsed && voucher.expires_at && new Date(voucher.expires_at) < new Date();
  const isAvailable = !isUsed && !isExpired;

  const voucherCode = voucher.pin ? `#VCH-${voucher.pin}` : `#VCH-${voucher.id.slice(-6).toUpperCase()}`;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(voucherCode);
    setCopied(true);
    toast.success("Código do voucher copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col gap-3",
        isAvailable
          ? "bg-white border-emerald-200/80 hover:border-emerald-300"
          : "bg-slate-50/80 border-slate-200 opacity-75"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-dashed border-slate-200">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isAvailable
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-500"
            )}
          >
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="font-bold text-slate-900 text-base leading-tight">
                {voucher.title}
              </h5>
              {voucher.reward_type === "PERCENTAGE" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {voucher.discount_value}% OFF
                </span>
              )}
              {voucher.reward_type === "FIXED_AMOUNT" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  R$ {Number(voucher.discount_value || 0).toFixed(2)} OFF
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Emitido em {new Date(voucher.created_at).toLocaleDateString("pt-BR")} &bull; {voucher.points_spent} pts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={cn(
              "text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-wider",
              isAvailable
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300/50"
                : isUsed
                ? "bg-slate-200 text-slate-600"
                : "bg-red-100 text-red-700 border border-red-300/50"
            )}
          >
            {isUsed ? "Utilizado" : isExpired ? "Expirado" : "Pronto para Uso"}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Código do Voucher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">PIN:</span>
            <span className="font-mono font-black text-sm tracking-widest text-slate-900">
              {voucherCode}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Copiar código"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 text-[11px]">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px]">Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* Data de Validade ou Status */}
        <div className="text-xs">
          {voucher.expires_at && isAvailable && (
            <span className="font-semibold text-amber-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Válido até: {new Date(voucher.expires_at).toLocaleDateString("pt-BR")}
            </span>
          )}
          {isUsed && (
            <span className="text-slate-500 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
              Utilizado na recepção
            </span>
          )}
          {isExpired && (
            <span className="text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Expirado em {new Date(voucher.expires_at!).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
