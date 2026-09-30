"use client";

import React, { useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, DollarSign, PlusCircle, Filter, ExternalLink } from "lucide-react";

export default function CashFlowDemo() {
  const [selectedMonth, setSelectedMonth] = useState("outubro-2026");

  // Dados estáticos de exemplo (mock)
  const stats = {
    entradas: 15200.0,
    saidas: 4350.0,
    saldo: 10850.0,
  };

  const transactions = [
    {
      id: 1,
      date: "25/10/2026",
      description: "Pacote 10 Sessões - Drenagem",
      client: "Maria Silva",
      type: "RECEITA",
      amount: 1500.0,
    },
    {
      id: 2,
      date: "22/10/2026",
      description: "Conta de Energia (Celpe)",
      client: "-",
      type: "DESPESA",
      amount: -450.0,
    },
    {
      id: 3,
      date: "20/10/2026",
      description: "Compra de Óleo Essencial",
      client: "-",
      type: "DESPESA",
      amount: -150.0,
    },
    {
      id: 4,
      date: "18/10/2026",
      description: "Massagem Relaxante (Avulsa)",
      client: "João Pedro",
      type: "RECEITA",
      amount: 250.0,
    },
    {
      id: 5,
      date: "15/10/2026",
      description: "Manutenção do Ar Condicionado",
      client: "-",
      type: "DESPESA",
      amount: -300.0,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(value));
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa </h1>
          <p className="text-muted-foreground">
            Acompanhe as entradas de pacotes/serviços e as saídas da clínica.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="flex h-10 w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="novembro-2026">Novembro 2026</option>
            <option value="outubro-2026">Outubro 2026</option>
            <option value="setembro-2026">Setembro 2026</option>
          </select>

          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none bg-indigo-600 text-white hover:bg-indigo-700 h-10 py-2 px-4 gap-2 shadow-md">
            <ExternalLink className="w-4 h-4" />
            Exportar para o Zibbe
          </button>
          
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4 gap-2 shadow-md">
            <PlusCircle className="w-4 h-4" />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Entradas */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden group hover:border-green-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpCircle className="w-16 h-16 text-green-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Entradas (Pacotes e Serviços)</h3>
            <ArrowUpCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-500">
            {formatCurrency(stats.entradas)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">20 vendas este mês</p>
        </div>

        {/* Saídas */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden group hover:border-red-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowDownCircle className="w-16 h-16 text-red-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Saídas (Despesas)</h3>
            <ArrowDownCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-500">
            {formatCurrency(stats.saidas)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">12 despesas registradas</p>
        </div>

        {/* Saldo */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-blue-500" />
          </div>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Saldo Líquido</h3>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
            {formatCurrency(stats.saldo)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Lucro do mês selecionado</p>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6 border-b">
          <h3 className="font-semibold leading-none tracking-tight">Lançamentos Recentes</h3>
          <p className="text-sm text-muted-foreground">Últimas movimentações financeiras de Outubro.</p>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Descrição</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4 font-medium">{tx.description}</td>
                    <td className="px-6 py-4 text-muted-foreground">{tx.client}</td>
                    <td className="px-6 py-4">
                      {tx.type === "RECEITA" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Receita (Venda)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Despesa
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${tx.type === "RECEITA" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                      {tx.type === "RECEITA" ? "+" : "-"} {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
