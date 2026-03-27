// app/admin/finance/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  TrendingUp,
  Award,
  Activity,
  Send,
  BarChart3,
  Download,
  DollarSign,
} from "lucide-react";
import { getReportsData, sendMonthlyReport } from "@/app/actions/reports";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

// Gráficos
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

// OTIMIZAÇÃO: Formatador global
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatCurrency = (value: number) => {
  return currencyFormatter.format(value);
};

// Configurações dos Gráficos
const performanceChartConfig = {
  agendamentos: { label: "Agendamentos", color: "#6366f1" },
};

const financialChartConfig = {
  receitas: { label: "Receitas", color: "#10b981" },
  despesas: { label: "Despesas", color: "#f43f5e" },
};

const MONTHS = [
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

const mobileNavItems = [
  { id: "desempenho", label: "Desempenho", icon: Activity },
  { id: "servicos", label: "Curva ABC", icon: Award },
  { id: "exportar", label: "Exportar", icon: Download },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("desempenho");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [emailTo, setEmailTo] = useState("");

  const [data, setData] = useState<{
    monthlyData: any[];
    topServices: any[];
  } | null>(null);

  const currentYear = new Date().getFullYear();
  const startYear = 2026;
  const YEARS = Array.from(
    { length: currentYear - startYear + 2 },
    (_, i) => startYear + i,
  );

  useEffect(() => {
    async function loadData() {
      const res = await getReportsData();
      if (res.success) {
        setData({ monthlyData: res.monthlyData, topServices: res.topServices });
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSendReport = async () => {
    if (!emailTo) {
      toast.error("Por favor, informe um e-mail válido.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await sendMonthlyReport(selectedMonth, selectedYear, emailTo);

      if (res.success) {
        toast.success(`Relatório enviado com sucesso para ${emailTo}!`);
        setEmailTo("");
      } else {
        toast.error("Erro ao enviar o fechamento. Verifique o servidor.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro na comunicação com o servidor.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const maxFaturamento =
    data?.topServices.reduce(
      (max, service) => Math.max(max, service.faturamento),
      0,
    ) || 1;

  return (
    <>
      <AdminHeader title="Relatórios" />

      {/* 🔥 CONTAINER: max-w-400 com min-w-0 para evitar vazamento horizontal */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full min-w-0 pb-32 md:pb-12 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Relatórios
          </h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Acompanhe o crescimento, faturamento e os melhores serviços da sua
            clínica.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="flex flex-col items-center justify-center py-32 flex-1">
            <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4">
              Carregando dados...
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex-1 flex flex-col min-w-0" // min-w-0 crucial para o Recharts
          >
            {/* 🔥 TABS LIST: Idêntico ao Settings */}
            <TabsList className="hidden md:grid w-full grid-cols-3 bg-muted/40 h-14 rounded-2xl p-1 border border-border/50 shadow-sm">
              <TabsTrigger
                value="desempenho"
                className="flex gap-2 rounded-xl font-bold h-full data-[state=active]:shadow-sm transition-all"
              >
                <Activity className="h-4 w-4" /> Desempenho
              </TabsTrigger>
              <TabsTrigger
                value="servicos"
                className="flex gap-2 rounded-xl font-bold h-full data-[state=active]:shadow-sm transition-all"
              >
                <Award className="h-4 w-4" /> Curva ABC
              </TabsTrigger>
              <TabsTrigger
                value="exportar"
                className="flex gap-2 rounded-xl font-bold h-full data-[state=active]:shadow-sm transition-all"
              >
                <Download className="h-4 w-4" /> Exportar
              </TabsTrigger>
            </TabsList>

            {/* 🔥 CONTAINER INTERNO: mt-6 e min-w-0 flex-1 */}
            <div className="mt-6 flex-1 min-w-0">
              {/* ABA 1: DESEMPENHO */}
              <TabsContent
                value="desempenho"
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 min-w-0"
              >
                {/* Gráfico 1: Agendamentos */}
                <Card className="rounded-3xl border-border/50 shadow-sm bg-card overflow-hidden">
                  <CardHeader className="px-6 pt-6 pb-2 border-b border-border/40">
                    <CardTitle className="flex items-center gap-2 text-lg font-black text-foreground">
                      <TrendingUp
                        className="h-5 w-5 text-indigo-500"
                        strokeWidth={2.5}
                      />
                      Volume de Agendamentos
                    </CardTitle>
                    <CardDescription className="font-medium text-muted-foreground pb-2">
                      Quantidade de atendimentos realizados nos últimos 6 meses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6 pt-6 pb-6 min-w-0">
                    <ChartContainer
                      config={performanceChartConfig}
                      className="h-64 w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data.monthlyData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorAgendamentos"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--color-agendamentos)"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="var(--color-agendamentos)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="currentColor"
                            className="opacity-10"
                          />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fontWeight: "bold" }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fontWeight: "bold" }}
                            className="text-muted-foreground hidden sm:block"
                          />
                          <Tooltip
                            content={<ChartTooltipContent />}
                            cursor={{
                              stroke: "currentColor",
                              strokeWidth: 1,
                              opacity: 0.2,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="agendamentos"
                            stroke="var(--color-agendamentos)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorAgendamentos)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Gráfico 2: Receitas x Despesas */}
                <Card className="rounded-3xl border-border/50 shadow-sm bg-card overflow-hidden">
                  <CardHeader className="px-6 pt-6 pb-2 border-b border-border/40">
                    <CardTitle className="flex items-center gap-2 text-lg font-black text-foreground">
                      <DollarSign
                        className="h-5 w-5 text-emerald-500"
                        strokeWidth={2.5}
                      />
                      Receitas x Despesas
                    </CardTitle>
                    <CardDescription className="font-medium text-muted-foreground pb-2">
                      Comparativo financeiro mensal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6 pt-6 pb-6 min-w-0">
                    <ChartContainer
                      config={financialChartConfig}
                      className="h-64 w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.monthlyData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="currentColor"
                            className="opacity-10"
                          />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fontWeight: "bold" }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            tickFormatter={(value) => `R$${value}`}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fontWeight: "bold" }}
                            className="text-muted-foreground hidden sm:block"
                          />
                          <Tooltip
                            content={
                              <ChartTooltipContent
                                formatter={(val) => formatCurrency(Number(val))}
                              />
                            }
                            cursor={{ fill: "currentColor", opacity: 0.05 }}
                          />
                          <Bar
                            dataKey="receitas"
                            fill="var(--color-receitas)"
                            radius={[6, 6, 0, 0]}
                          />
                          <Bar
                            dataKey="despesas"
                            fill="var(--color-despesas)"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ABA 2: CURVA ABC */}
              <TabsContent
                value="servicos"
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500 min-w-0"
              >
                <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden bg-card">
                  <CardHeader className="px-6 pt-6 pb-4 border-b border-border/40">
                    <CardTitle className="flex items-center gap-2 text-lg font-black text-foreground">
                      <Award
                        className="h-5 w-5 text-amber-500"
                        strokeWidth={2.5}
                      />
                      Top Serviços
                    </CardTitle>
                    <CardDescription className="font-medium text-muted-foreground">
                      Os serviços que mais trouxeram receita nos últimos 6
                      meses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.topServices.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-muted-foreground font-bold">
                        Nenhum serviço finalizado ainda.
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-border/40">
                        {data.topServices.map((service, index) => {
                          const percent =
                            (service.faturamento / maxFaturamento) * 100;
                          return (
                            <div
                              key={index}
                              className="relative flex items-center justify-between p-5 sm:px-6 hover:bg-muted/10 transition-colors"
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-primary/5 -z-10"
                                style={{ width: `${percent}%` }}
                              />
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black text-sm border",
                                    index === 0
                                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                      : index === 1
                                        ? "bg-slate-500/10 text-slate-600 border-slate-500/20"
                                        : index === 2
                                          ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                          : "bg-muted/50 text-muted-foreground border-transparent",
                                  )}
                                >
                                  {index + 1}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-black text-foreground leading-tight">
                                    {service.name}
                                  </span>
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    {service.sessoes} atendimentos
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-base sm:text-lg text-primary tracking-tight">
                                  {formatCurrency(service.faturamento)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ABA 3: EXPORTAR */}
              <TabsContent
                value="exportar"
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500 min-w-0"
              >
                <Card className="rounded-3xl border-border/50 shadow-sm bg-card p-2 md:p-0">
                  <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-border/40">
                    <CardTitle className="flex items-center gap-2 text-lg font-black text-foreground">
                      <Download
                        className="h-5 w-5 text-primary"
                        strokeWidth={2.5}
                      />
                      Exportar Fechamento
                    </CardTitle>
                    <CardDescription className="font-medium text-muted-foreground">
                      Gere um PDF detalhado das receitas e despesas para envio
                      ao e-mail informado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 px-4 md:px-6 pt-6 pb-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Selecione o Período
                      </Label>
                      <div className="flex items-center gap-3">
                        <Select
                          value={selectedMonth.toString()}
                          onValueChange={(val) => setSelectedMonth(Number(val))}
                        >
                          <SelectTrigger className="h-12 w-full sm:w-40 rounded-2xl bg-card border border-border/50 font-bold focus:ring-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                            {MONTHS.map((m) => (
                              <SelectItem
                                key={m.value}
                                value={m.value.toString()}
                                className="font-bold rounded-xl"
                              >
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={selectedYear.toString()}
                          onValueChange={(val) => setSelectedYear(Number(val))}
                        >
                          <SelectTrigger className="h-12 w-full sm:w-32 rounded-2xl bg-card border border-border/50 font-bold focus:ring-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                            {YEARS.map((y) => (
                              <SelectItem
                                key={y}
                                value={y.toString()}
                                className="font-bold rounded-xl"
                              >
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        E-mail de Destino
                      </Label>
                      <Input
                        type="email"
                        placeholder="contato@exemplo.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="h-12 rounded-2xl bg-card border border-border/50 font-bold focus-visible:ring-primary/20 pl-4"
                      />
                    </div>

                    <div className="flex justify-start pt-2">
                      <Button
                        className="rounded-2xl h-12 px-8 font-black hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto shadow-md shadow-primary/20"
                        onClick={handleSendReport}
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-5 w-5" strokeWidth={2.5} />
                        )}
                        {isSendingEmail ? "Enviando..." : "Enviar Fechamento"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>

      <MobileBottomNav
        items={mobileNavItems}
        activeId={activeTab}
        onChange={setActiveTab}
      />
    </>
  );
}
