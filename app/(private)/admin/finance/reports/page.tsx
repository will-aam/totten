// app/(private)/admin/finance/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
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
  LoaderDots,
  TrendingUp,
  MedalStarAlt,
  Pulse,
  Send,
  BarChart as BarChartIcon,
  ArrowToBottom,
  Dollar,
} from "@boxicons/react";
import { getReportsData, sendMonthlyReport } from "@/app/actions/reports";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

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

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

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
  { id: "desempenho", label: "Desempenho", icon: Pulse },
  { id: "servicos", label: "Curva ABC", icon: MedalStarAlt },
  { id: "exportar", label: "Exportar", icon: ArrowToBottom },
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
    } catch {
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
      <AdminHeader title="Relatórios Financeiros" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full min-w-0 pb-32 md:pb-12 relative animate-in fade-in duration-700 min-h-[calc(100vh-100px)]">
        <div className="flex flex-col gap-1.5 border-b border-border/40 pb-5">
          <h2 className="text-3xl font-black tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <BarChartIcon size="sm" />
            </div>
            Desempenho
          </h2>
          <p className="text-muted-foreground text-sm font-medium mt-1 ml-12">
            Acompanhe o crescimento, faturamento e os melhores serviços da sua
            clínica.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="flex flex-col items-center justify-center py-32 flex-1">
            <LoaderDots size="lg" className="text-primary/50 animate-pulse" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4">
              Carregando dados do relatório...
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex-1 flex flex-col min-w-0"
          >
            <TabsList className="hidden md:grid w-full max-w-2xl grid-cols-3 bg-background/50 backdrop-blur-md h-16 rounded-3xl p-1.5 border border-border/40 shadow-sm">
              <TabsTrigger
                value="desempenho"
                className="flex gap-2 rounded-2xl font-bold text-sm h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                <Pulse size="sm" /> Desempenho
              </TabsTrigger>
              <TabsTrigger
                value="servicos"
                className="flex gap-2 rounded-2xl font-bold text-sm h-full data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm transition-all"
              >
                <MedalStarAlt size="sm" /> Curva ABC
              </TabsTrigger>
              <TabsTrigger
                value="exportar"
                className="flex gap-2 rounded-2xl font-bold text-sm h-full data-[state=active]:bg-foreground/5 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
              >
                <ArrowToBottom size="sm" /> Exportar
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 flex-1 min-w-0">
              {/* ABA 1: DESEMPENHO */}
              <TabsContent
                value="desempenho"
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 min-w-0"
              >
                <Card className="relative overflow-hidden rounded-4xl border-border/40 shadow-sm bg-background/50 backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -z-10 pointer-events-none" />
                  <CardHeader className="px-6 pt-6 pb-2 border-b border-border/30">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-foreground">
                      <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                        <TrendingUp size="sm" />
                      </div>
                      Volume de Agendamentos
                    </CardTitle>
                    <CardDescription className="font-medium text-xs uppercase tracking-widest text-muted-foreground pb-2 ml-12">
                      Quantidade de atendimentos realizados nos últimos 6 meses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6 pt-6 pb-6 min-w-0">
                    <ChartContainer
                      config={performanceChartConfig}
                      className="h-75 w-full"
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
                            className="opacity-5"
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
                              opacity: 0.1,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="agendamentos"
                            stroke="var(--color-agendamentos)"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorAgendamentos)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden rounded-4xl border-border/40 shadow-sm bg-background/50 backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -z-10 pointer-events-none" />
                  <CardHeader className="px-6 pt-6 pb-2 border-b border-border/30">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-foreground">
                      <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                        <Dollar size="sm" />
                      </div>
                      Receitas x Despesas
                    </CardTitle>
                    <CardDescription className="font-medium text-xs uppercase tracking-widest text-muted-foreground pb-2 ml-12">
                      Comparativo financeiro mensal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6 pt-6 pb-6 min-w-0">
                    <ChartContainer
                      config={financialChartConfig}
                      className="h-75 w-full"
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
                            className="opacity-5"
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
                            radius={[8, 8, 0, 0]}
                          />
                          <Bar
                            dataKey="despesas"
                            fill="var(--color-despesas)"
                            radius={[8, 8, 0, 0]}
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
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0"
              >
                <Card className="relative overflow-hidden rounded-4xl border-border/40 shadow-sm bg-background/50 backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full -z-10 pointer-events-none" />
                  <CardHeader className="px-6 pt-6 pb-4 border-b border-border/30">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-foreground">
                      <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                        <MedalStarAlt size="sm" />
                      </div>
                      Top Serviços
                    </CardTitle>
                    <CardDescription className="font-medium text-xs uppercase tracking-widest text-muted-foreground ml-12">
                      Os serviços que mais trouxeram receita nos últimos 6
                      meses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.topServices.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10">
                        <MedalStarAlt className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                          Nenhum serviço finalizado ainda.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-border/30">
                        {data.topServices.map((service, index) => {
                          const percent =
                            (service.faturamento / maxFaturamento) * 100;
                          return (
                            <div
                              key={index}
                              className="relative flex items-center justify-between p-5 sm:px-6 hover:bg-muted/30 transition-colors group"
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-primary/5 -z-10 transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-sm shadow-sm transition-transform group-hover:scale-105",
                                    index === 0
                                      ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                      : index === 1
                                        ? "bg-slate-500/10 text-slate-600 border border-slate-500/20"
                                        : index === 2
                                          ? "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                                          : "bg-background/80 text-muted-foreground border border-border/50",
                                  )}
                                >
                                  {index + 1}º
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-black text-foreground leading-tight text-base group-hover:text-primary transition-colors">
                                    {service.name}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                    {service.sessoes} atendimentos
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-lg sm:text-xl text-primary tracking-tighter">
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
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0"
              >
                <Card className="relative overflow-hidden rounded-4xl border-border/40 shadow-sm bg-background/50 backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -z-10 pointer-events-none" />
                  <CardHeader className="px-6 pt-6 pb-4 border-b border-border/30">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-foreground">
                      <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <ArrowToBottom size="sm" />
                      </div>
                      Exportar Fechamento
                    </CardTitle>
                    <CardDescription className="font-medium text-xs uppercase tracking-widest text-muted-foreground ml-12">
                      Gere um PDF detalhado das receitas e despesas para envio
                      ao e-mail.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 px-6 pt-8 pb-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Selecione o Período
                      </Label>
                      <div className="flex items-center gap-4">
                        <Select
                          value={selectedMonth.toString()}
                          onValueChange={(val) => setSelectedMonth(Number(val))}
                        >
                          <SelectTrigger className="h-14 w-full sm:w-48 rounded-2xl bg-muted/20 border-border/40 hover:bg-muted/30 font-bold focus:ring-primary/30 transition-all shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                            {MONTHS.map((m) => (
                              <SelectItem
                                key={m.value}
                                value={m.value.toString()}
                                className="font-bold rounded-xl my-0.5"
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
                          <SelectTrigger className="h-14 w-full sm:w-36 rounded-2xl bg-muted/20 border-border/40 hover:bg-muted/30 font-bold focus:ring-primary/30 transition-all shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-border/50 shadow-xl">
                            {YEARS.map((y) => (
                              <SelectItem
                                key={y}
                                value={y.toString()}
                                className="font-bold rounded-xl my-0.5"
                              >
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3 max-w-md">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        E-mail de Destino
                      </Label>
                      <Input
                        type="email"
                        placeholder="contato@exemplo.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/20 border-border/40 hover:bg-muted/30 font-bold focus-visible:ring-primary/30 pl-4 transition-all shadow-inner text-base"
                      />
                    </div>

                    <div className="flex justify-start pt-2">
                      <Button
                        className="rounded-2xl h-14 px-8 font-black active:scale-95 transition-all w-full md:w-auto shadow-[0_8px_25px_rgb(var(--primary)/0.3)] hover:shadow-[0_10px_30px_rgb(var(--primary)/0.4)] text-base"
                        onClick={handleSendReport}
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? (
                          <LoaderDots size="sm" className="animate-spin mr-2" />
                        ) : (
                          <Send size="sm" className="mr-2" />
                        )}
                        {isSendingEmail
                          ? "Processando e Enviando..."
                          : "Enviar Fechamento PDF"}
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
