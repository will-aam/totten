"use client";

import React, { forwardRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ThermalReceiptProps {
  appointment: any;
  settings: any;
}

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ appointment, settings }, ref) => {
    if (!appointment) return null;

    const today = new Date();

    // Fallback para preço caso não venha no objeto (ajustaremos na busca se necessário)
    const displayPrice = appointment.price
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(appointment.price)
      : "R$ 0,00";

    return (
      /* MÁGICA DO PRINT: 
         O 'hidden' esconde da tela. 
         O 'block' dentro do @media print (via global CSS ou style inline) faz aparecer só na impressora.
      */
      <div className="hidden print:block">
        <div
          ref={ref}
          className="w-[80mm] p-5 bg-white text-black font-mono text-[12px] leading-tight mx-auto"
          style={{ color: "#000" }}
        >
          {/* Cabeçalho da Clínica */}
          <div className="text-center mb-4">
            <h2 className="text-sm font-bold uppercase mb-1">
              {settings?.company_name || "TOTTEN GESTÃO"}
            </h2>
            {settings?.phone_whatsapp && (
              <p className="text-[10px]">Whats: {settings.phone_whatsapp}</p>
            )}
            <div className="border-b border-black border-dashed my-2" />
            <p className="font-bold text-[13px] uppercase">*** RECIBO ***</p>
          </div>

          {/* Identificação do Atendimento */}
          <div className="space-y-1 mb-4">
            <p className="truncate">
              CLIENTE: {appointment.clientName.toUpperCase()}
            </p>
            <p>DATA: {format(today, "dd/MM/yyyy")}</p>
            <p>HORA: {format(today, "HH:mm:ss")}</p>
          </div>

          <div className="border-b border-black border-dashed my-2" />

          {/* Detalhes do Serviço */}
          <table className="w-full mb-4">
            <thead>
              <tr className="text-left font-bold">
                <td>DESCRIÇÃO</td>
                <td className="text-right">VALOR</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pt-2">
                  <p className="font-bold">{appointment.service}</p>
                  <p className="text-[10px] italic">
                    {appointment.sessionInfo || "Sessão Avulsa"}
                  </p>
                </td>
                <td className="text-right align-top pt-2">{displayPrice}</td>
              </tr>
            </tbody>
          </table>

          <div className="border-b border-black border-dashed my-2" />

          {/* Totalizador */}
          <div className="flex justify-between items-center text-[14px] font-bold mb-6">
            <span>TOTAL:</span>
            <span>{displayPrice}</span>
          </div>

          {/* Rodapé e Assinatura */}
          <div className="text-center space-y-4">
            <p className="text-[10px]">
              Este documento não possui valor fiscal.
            </p>

            <div className="mt-8 pt-4">
              <p className="mb-0">__________________________</p>
              <p className="text-[10px] uppercase">
                {settings?.company_name || "Responsável"}
              </p>
            </div>

            <div className="pt-4 pb-2">
              <p className="text-[10px] italic">
                Obrigado pela confiança! 💆‍♀️✨
              </p>
              <p className="text-[8px] mt-2 opacity-50 italic">
                Powered by Totten
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ThermalReceipt.displayName = "ThermalReceipt";
