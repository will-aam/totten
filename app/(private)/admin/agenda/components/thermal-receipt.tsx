"use client";

import React, { forwardRef } from "react";
import { format } from "date-fns";

interface ThermalReceiptProps {
  appointment: any;
  settings: any;
}

export const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ appointment, settings }, ref) => {
    if (!appointment) return null;

    const today = new Date();

    const rawPrice =
      appointment.package?.price ??
      appointment.price ??
      appointment.service?.price ??
      0;

    const priceValue = Number(rawPrice);

    const formattedPrice = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(priceValue);

    const isPackage = !!appointment.packageId;

    return (
      <>
        {/* 
           Adicionando a fonte "Courier Prime" do Google Fonts.
           Ela é a fonte padrão de recibo térmico moderno.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap"
          rel="stylesheet"
        />

        <div className="hidden print:block">
          <div
            ref={ref}
            className="w-[80mm] p-5 bg-white text-black text-[11px] leading-tight mx-auto"
            style={{
              color: "#000",
              // Aplicando a fonteCourier Prime aqui
              fontFamily: "'Courier Prime', 'Courier New', monospace",
            }}
          >
            {/* Cabeçalho */}
            <div className="text-center mb-4">
              <h2 className="text-sm font-bold uppercase mb-1">
                {settings?.trade_name ||
                  settings?.company_name ||
                  "TOTTEN GESTÃO"}
              </h2>
              {settings?.phone_whatsapp && (
                <p className="text-[10px]">Whats: {settings.phone_whatsapp}</p>
              )}
              <div className="border-b border-black border-dashed my-2" />
              <p className="font-bold text-[12px] uppercase">*** RECIBO ***</p>
            </div>

            {/* Dados do Cliente */}
            <div className="space-y-1 mb-3">
              <p className="truncate">
                CLIENTE: {appointment.clientName?.toUpperCase()}
              </p>
              <p>
                DATA: {format(today, "dd/MM/yyyy")} - {format(today, "HH:mm")}
              </p>
            </div>

            <div className="border-b border-black border-dashed my-2" />

            {/* Itens */}
            <table className="w-full mb-3">
              <thead>
                <tr className="text-left font-bold border-b border-black">
                  <td className="pb-1">DESCRICAO</td>
                  <td className="text-right pb-1">VALOR</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pt-2">
                    <p className="font-bold">{appointment.service}</p>
                    <p className="text-[9px]">
                      {appointment.sessionInfo || "Sessao Avulsa"}
                    </p>
                  </td>
                  <td className="text-right align-top pt-2">
                    {isPackage ? "PACOTE" : formattedPrice}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Observações */}
            {appointment.observations && (
              <div className="mb-3 p-2 border border-black border-dotted rounded">
                <p className="font-bold text-[9px] mb-1 uppercase">
                  Observacoes:
                </p>
                <p className="text-[9px] leading-snug">
                  {appointment.observations}
                </p>
              </div>
            )}

            <div className="border-b border-black border-dashed my-2" />

            {/* Totais */}
            <div className="flex justify-between items-center text-[12px] font-bold">
              <span>TOTAL:</span>
              <span>{formattedPrice}</span>
            </div>

            <div className="flex justify-between items-center text-[11px] mt-1">
              <span>VALOR PAGO HOJE:</span>
              <span className="font-bold">
                {isPackage ? "R$ 0,00" : formattedPrice}
              </span>
            </div>

            {/* Assinatura e Rodapé */}
            <div className="text-center mt-8">
              <div className="border-t border-black w-3/4 mx-auto mb-1" />
              <p className="text-[9px] uppercase">
                {settings?.trade_name || "Assinatura"}
              </p>

              <p className="text-[9px] mt-6">Agradecemos a preferência!</p>
              <p className="text-[7px] mt-6 opacity-80">totten.com.br</p>
            </div>
          </div>
        </div>
      </>
    );
  },
);

ThermalReceipt.displayName = "ThermalReceipt";
