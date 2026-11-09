// app/(private)/admin/master/_components/master-financial-reports.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { type MasterClinicItem } from "@/app/actions/master";
import { OFFICIAL_PLANS, PLAN_PRICES, type OfficialPlan } from "@/lib/plans";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Target,
  Calculator,
  PieChart,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface MasterFinancialReportsProps {
  clinics: MasterClinicItem[];
}

const STORAGE_KEY_COSTS = "totten_master_costs";
const STORAGE_KEY_GOAL = "totten_master_goal";

export function MasterFinancialReports({ clinics }: MasterFinancialReportsProps) {
  // 1. Custos operacionais fixos preenchidos pelo dono (persistidos no navegador)
  const [costs, setCosts] = useState<number>(0);

  // 2. Meta financeira mensal estabelecida pelo dono (persistida no navegador)
  const [goal, setGoal] = useState<number>(5000);

  // 3. Carregar dados persistidos no cliente
  useEffect(() => {
    try {
      const savedCosts = localStorage.getItem(STORAGE_KEY_COSTS);
      if (savedCosts !== null) {
        setCosts(Number(savedCosts) || 0);
      }
      const savedGoal = localStorage.getItem(STORAGE_KEY_GOAL);
      if (savedGoal !== null) {
        setGoal(Number(savedGoal) || 5000);
      }
    } catch {
      // Ignorar erros em ambiente SSR/Storage restrito
    }
  }, []);

  const handleCostsChange = (value: number) => {
    const val = Math.max(0, value);
    setCosts(val);
    try {
      localStorage.setItem(STORAGE_KEY_COSTS, String(val));
    } catch {}
  };

  const handleGoalChange = (value: number) => {
    const val = Math.max(0, value);
    setGoal(val);
    try {
      localStorage.setItem(STORAGE_KEY_GOAL, String(val));
    } catch {}
  };

  // 4. Cálculos dos clientes e MRR real atual
  const financialData = useMemo(() => {
    const activeClinics = clinics.filter((c) => c.subscription_status === "ACTIVE");
    const trialClinics = clinics.filter((c) => c.subscription_status === "TRIAL");

    const basicCount = activeClinics.filter((c) => c.plan === "BASIC").length;
    const mediumCount = activeClinics.filter((c) => c.plan === "MEDIUM").length;
    const advancedCount = activeClinics.filter((c) => c.plan === "ADVANCED").length;

    const basicRevenue = basicCount * PLAN_PRICES.BASIC.monthly;
    const mediumRevenue = mediumCount * PLAN_PRICES.MEDIUM.monthly;
    const advancedRevenue = advancedCount * PLAN_PRICES.ADVANCED.monthly;

    const grossMonthlyRevenue = basicRevenue + mediumRevenue + advancedRevenue;
    const netProfit = grossMonthlyRevenue - costs;

    // Ponto de equilíbrio (quantos clientes de cada plano cobrem os custos fixos)
    const breakEvenBasic = costs > 0 ? Math.ceil(costs / PLAN_PRICES.BASIC.monthly) : 0;
    const breakEvenMedium = costs > 0 ? Math.ceil(costs / PLAN_PRICES.MEDIUM.monthly) : 0;
    const breakEvenAdvanced = costs > 0 ? Math.ceil(costs / PLAN_PRICES.ADVANCED.monthly) : 0;

    // Cálculo da meta
    const progressPercent = goal > 0 ? Math.min(100, (grossMonthlyRevenue / goal) * 100) : 0;
    const remainingToGoal = Math.max(0, goal - grossMonthlyRevenue);

    // Quantos clientes a mais são necessários para bater a meta
    const neededBasic = remainingToGoal > 0 ? Math.ceil(remainingToGoal / PLAN_PRICES.BASIC.monthly) : 0;
    const neededMedium = remainingToGoal > 0 ? Math.ceil(remainingToGoal / PLAN_PRICES.MEDIUM.monthly) : 0;
    const neededAdvanced = remainingToGoal > 0 ? Math.ceil(remainingToGoal / PLAN_PRICES.ADVANCED.monthly) : 0;

    // Ticket médio mensal por cliente ativo
    const averageTicket = activeClinics.length > 0 ? grossMonthlyRevenue / activeClinics.length : 0;

    return {
      activeCount: activeClinics.length,
      trialCount: trialClinics.length,
      basicCount,
      mediumCount,
      advancedCount,
      basicRevenue,
      mediumRevenue,
      advancedRevenue,
      grossMonthlyRevenue,
      netProfit,
      breakEvenBasic,
      breakEvenMedium,
      breakEvenAdvanced,
      progressPercent,
      remainingToGoal,
      neededBasic,
      neededMedium,
      neededAdvanced,
      averageTicket,
    };
  }, [clinics, costs, goal]);

  // 5. Estado do Simulador de Cenários
  const [simBasic, setSimBasic] = useState<number>(10);
  const [simMedium, setSimMedium] = useState<number>(10);
  const [simAdvanced, setSimAdvanced] = useState<number>(5);

  const simulationData = useMemo(() => {
    const simRevenue =
      simBasic * PLAN_PRICES.BASIC.monthly +
      simMedium * PLAN_PRICES.MEDIUM.monthly +
      simAdvanced * PLAN_PRICES.ADVANCED.monthly;
    const simNet = simRevenue - costs;
    return {
      totalClients: simBasic + simMedium + simAdvanced,
      simRevenue,
      simNet,
    };
  }, [simBasic, simMedium, simAdvanced, costs]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      {/* 1. Indicadores Principais de Desempenho (Receita, Custos e Lucro) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Bruta Recorrente (MRR) */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Receita Mensal (MRR)
            </span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {formatBRL(financialData.grossMonthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financialData.activeCount} assinante{financialData.activeCount === 1 ? "" : "s"} pagante{financialData.activeCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Custos Operacionais Fixos (Editável) */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Custos do Sistema
            </span>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-muted-foreground">R$</span>
              <Input
                type="number"
                min="0"
                step="10"
                value={costs || ""}
                onChange={(e) => handleCostsChange(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="h-9 text-lg font-bold text-foreground bg-background rounded-xl w-32 border-border/60"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Servidor, banco, APIs e custos fixos mensais
            </p>
          </div>
        </div>

        {/* Resultado Líquido Mensal */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Lucro Líquido Mensal
            </span>
            <TrendingUp
              className={`h-4 w-4 ${
                financialData.netProfit >= 0
                  ? "text-emerald-500"
                  : "text-amber-500"
              }`}
            />
          </div>
          <div>
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                financialData.netProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {formatBRL(financialData.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financialData.netProfit >= 0
                ? "Resultado operacional positivo"
                : "Abaixo do ponto de equilíbrio"}
            </p>
          </div>
        </div>

        {/* Clientes em Teste (Trial - Potencial Futuro) */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Em Avaliação (Trial)
            </span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {financialData.trialCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Potencial de até {formatBRL(financialData.trialCount * PLAN_PRICES.BASIC.monthly)} a {formatBRL(financialData.trialCount * PLAN_PRICES.ADVANCED.monthly)}/mês
            </p>
          </div>
        </div>
      </div>

      {/* 2. Seção: Meta Financeira e Análise de Clientes Necessários */}
      <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Planejamento de Metas da Plataforma
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Defina sua meta de receita mensal e veja quantos clientes você precisa conquistar em cada plano.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-muted-foreground font-medium">Meta Mensal:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">R$</span>
              <Input
                type="number"
                min="100"
                step="500"
                value={goal || ""}
                onChange={(e) => handleGoalChange(parseFloat(e.target.value) || 0)}
                placeholder="5000"
                className="h-9 w-28 text-sm font-bold bg-background rounded-xl border-border/60"
              />
            </div>
          </div>
        </div>

        {/* Barra de Progresso da Meta */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground">
              {financialData.progressPercent.toFixed(1)}% alcançado
            </span>
            <span className="text-muted-foreground">
              {formatBRL(financialData.grossMonthlyRevenue)} de {formatBRL(goal)}
            </span>
          </div>

          <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden p-0.5 border border-border/40">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${financialData.progressPercent}%` }}
            />
          </div>

          {financialData.remainingToGoal > 0 ? (
            <p className="text-xs text-muted-foreground">
              Faltam <span className="font-semibold text-foreground">{formatBRL(financialData.remainingToGoal)}</span> por mês para atingir sua meta.
            </p>
          ) : (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Parabéns! Você atingiu e superou sua meta estipulada!
            </p>
          )}
        </div>

        {/* Quantos clientes faltam por plano */}
        {financialData.remainingToGoal > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Quantos clientes você precisa para bater a meta:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opção 1: No Plano Básico */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Plano Básico
                  </span>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/10 text-[11px]">
                    R$ 29,90/mês
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    +{financialData.neededBasic}
                  </span>
                  <span className="text-xs text-muted-foreground">clientes pagantes</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Se todos os novos clientes assinarem o plano essencial.
                </p>
              </div>

              {/* Opção 2: No Plano Padrão */}
              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                    Plano Padrão
                  </span>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-500/10 text-[11px]">
                    R$ 49,90/mês
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    +{financialData.neededMedium}
                  </span>
                  <span className="text-xs text-muted-foreground">clientes pagantes</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Mais procurado por estabelecimentos em crescimento.
                </p>
              </div>

              {/* Opção 3: No Plano Avançado */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Plano Avançado
                  </span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 text-[11px]">
                    R$ 89,90/mês
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    +{financialData.neededAdvanced}
                  </span>
                  <span className="text-xs text-muted-foreground">clientes pagantes</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Menor esforço de aquisição para alcançar o objetivo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ponto de Equilíbrio (Break-even dos custos) */}
        {costs > 0 && (
          <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <AlertCircle className="h-4 w-4 text-primary shrink-0" />
              <span>
                Para cobrir seu custo fixo de {formatBRL(costs)}/mês, você precisa de:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <span className="bg-background px-2.5 py-1 rounded-lg border border-border/40 font-semibold text-foreground">
                {financialData.breakEvenBasic} clientes no Básico
              </span>
              <span>ou</span>
              <span className="bg-background px-2.5 py-1 rounded-lg border border-border/40 font-semibold text-foreground">
                {financialData.breakEvenMedium} no Padrão
              </span>
              <span>ou</span>
              <span className="bg-background px-2.5 py-1 rounded-lg border border-border/40 font-semibold text-foreground">
                {financialData.breakEvenAdvanced} no Avançado
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Distribuição Atual da Base por Plano & Simulador Interativo de Escala */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição Real dos Assinantes Atuais */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Distribuição Atual dos Assinantes
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {financialData.activeCount} assinante{financialData.activeCount === 1 ? "" : "s"} ativo{financialData.activeCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {/* Linha Básico */}
            <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="font-semibold text-foreground">Plano Básico (R$ 29,90)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{financialData.basicCount} cliente{financialData.basicCount === 1 ? "" : "s"}</span>
                <span className="font-bold text-foreground">{formatBRL(financialData.basicRevenue)}/mês</span>
              </div>
            </div>

            {/* Linha Padrão */}
            <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="font-semibold text-foreground">Plano Padrão (R$ 49,90)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{financialData.mediumCount} cliente{financialData.mediumCount === 1 ? "" : "s"}</span>
                <span className="font-bold text-foreground">{formatBRL(financialData.mediumRevenue)}/mês</span>
              </div>
            </div>

            {/* Linha Avançado */}
            <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-foreground">Plano Avançado (R$ 89,90)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{financialData.advancedCount} cliente{financialData.advancedCount === 1 ? "" : "s"}</span>
                <span className="font-bold text-foreground">{formatBRL(financialData.advancedRevenue)}/mês</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/40 bg-background/50 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Ticket Médio por Cliente:</span>
            <span className="font-bold text-foreground">
              {formatBRL(financialData.averageTicket)} / cliente
            </span>
          </div>
        </div>

        {/* Simulador Rápido de Projeção Financeira */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Simulador de Crescimento e Lucro
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              Projeção sob demanda
            </span>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <label className="text-muted-foreground">Clientes no Plano Básico (R$ 29,90):</label>
              <Input
                type="number"
                min="0"
                value={simBasic}
                onChange={(e) => setSimBasic(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 w-20 text-center font-bold bg-background rounded-xl border-border/60"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="text-muted-foreground">Clientes no Plano Padrão (R$ 49,90):</label>
              <Input
                type="number"
                min="0"
                value={simMedium}
                onChange={(e) => setSimMedium(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 w-20 text-center font-bold bg-background rounded-xl border-border/60"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="text-muted-foreground">Clientes no Plano Avançado (R$ 89,90):</label>
              <Input
                type="number"
                min="0"
                value={simAdvanced}
                onChange={(e) => setSimAdvanced(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 w-20 text-center font-bold bg-background rounded-xl border-border/60"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/40 bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs text-muted-foreground block">
                Total Simulado: {simulationData.totalClients} estabelecimentos
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatBRL(simulationData.simRevenue)} <span className="text-xs font-normal text-muted-foreground">/mês bruto</span>
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-muted-foreground block">Lucro Líquido Estimado:</span>
              <span className={`text-lg font-bold ${simulationData.simNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {formatBRL(simulationData.simNet)} <span className="text-xs font-normal text-muted-foreground">/mês</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

