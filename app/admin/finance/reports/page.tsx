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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Configurações dos Gráficos
const performanceChartConfig = {
  agendamentos: { label: "Agendamentos", color: "#6366f1" }, // indigo-500
};

const financialChartConfig = {
  receitas: { label: "Receitas", color: "#10b981" }, // emerald-500
  despesas: { label: "Despesas", color: "#f43f5e" }, // rose-500
};

// Dados para os Selects de Exportação
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

  // Estados para exportação
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
      // Chama a nossa nova action passando os filtros da tela!
      const res = await sendMonthlyReport(selectedMonth, selectedYear, emailTo);

      if (res.success) {
        toast.success(`Relatório enviado com sucesso para ${emailTo}!`);
        setEmailTo(""); // Limpa o campo após o sucesso
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

      {/* pb-24 garante espaço pro menu mobile não cobrir o conteúdo */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 md:pb-6 relative">
        <div className="mb-2">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Visão Estratégica
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe o crescimento, faturamento e os melhores serviços da sua
            clínica.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Menu Desktop: visível apenas a partir de telas médias */}
            <TabsList className="hidden md:grid w-full grid-cols-3 bg-muted mb-6">
              <TabsTrigger value="desempenho" className="flex gap-2">
                <Activity className="h-4 w-4" /> Desempenho
              </TabsTrigger>
              <TabsTrigger value="servicos" className="flex gap-2">
                <Award className="h-4 w-4" /> Curva ABC
              </TabsTrigger>
              <TabsTrigger value="exportar" className="flex gap-2">
                <Download className="h-4 w-4" /> Exportar
              </TabsTrigger>
            </TabsList>

            <div className="mt-2 md:mt-0">
              {/* ABA 1: DESEMPENHO (Agora com 2 gráficos!) */}
              <TabsContent
                value="desempenho"
                className="space-y-6 outline-none"
              >
                {/* Gráfico 1: Agendamentos */}
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-indigo-500" />
                      Volume de Agendamentos
                    </CardTitle>
                    <CardDescription>
                      Quantidade de atendimentos realizados nos últimos 6 meses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6 pt-4">
                    <ChartContainer
                      config={performanceChartConfig}
                      className="h-57.5 w-full"
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
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
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
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5 text-emerald-500" />
                      Receitas x Despesas
                    </CardTitle>
                    <CardDescription>
                      Comparativo financeiro mensal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6 pt-4">
                    <ChartContainer
                      config={financialChartConfig}
                      className="h-57.5 w-full"
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
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            tickFormatter={(value) => `R$${value}`}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
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
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="despesas"
                            fill="var(--color-despesas)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ABA 2: CURVA ABC */}
              <TabsContent value="servicos" className="outline-none">
                <Card className="rounded-2xl border-border/50  overflow-hidden">
                  <CardHeader className=" border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5 text-amber-500" />
                      Top Serviços
                    </CardTitle>
                    <CardDescription>
                      Os serviços que mais trouxeram receita nos últimos 6
                      meses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data.topServices.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        Nenhum serviço finalizado ainda.
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-border/30">
                        {data.topServices.map((service, index) => {
                          const percent =
                            (service.faturamento / maxFaturamento) * 100;
                          return (
                            <div
                              key={index}
                              className="relative flex items-center justify-between p-4 sm:px-6"
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-primary/5 -z-10"
                                style={{ width: `${percent}%` }}
                              />
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full font-black text-sm",
                                    index === 0
                                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                                      : index === 1
                                        ? "bg-slate-200 text-slate-700 border border-slate-300"
                                        : index === 2
                                          ? "bg-orange-100 text-orange-800 border border-orange-200"
                                          : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {index + 1}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground leading-tight">
                                    {service.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground mt-0.5">
                                    {service.sessoes} atendimentos
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-sm sm:text-base text-primary">
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
              <TabsContent value="exportar" className="outline-none">
                <Card className="rounded-2xl border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Download className="h-5 w-5 text-primary" />
                      Exportar Fechamento
                    </CardTitle>
                    <CardDescription>
                      Gere um PDF detalhado das receitas e despesas para envio
                      ao e-mail informado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Selecione o Período</Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedMonth.toString()}
                          onValueChange={(val) => setSelectedMonth(Number(val))}
                        >
                          <SelectTrigger className="h-12 w-full sm:w-37.5 rounded-xl bg-muted/30 border-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {MONTHS.map((m) => (
                              <SelectItem
                                key={m.value}
                                value={m.value.toString()}
                                className="rounded-lg"
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
                          <SelectTrigger className="h-12 w-full sm:w-30 rounded-xl bg-muted/30 border-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {YEARS.map((y) => (
                              <SelectItem
                                key={y}
                                value={y.toString()}
                                className="rounded-lg"
                              >
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>E-mail de Destino</Label>
                      <Input
                        type="email"
                        placeholder="contato@exemplo.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="h-12 rounded-xl bg-muted/30 border-none"
                      />
                    </div>

                    <Button
                      className="w-full sm:w-auto h-12 rounded-xl px-8 font-bold"
                      onClick={handleSendReport}
                      disabled={isSendingEmail}
                    >
                      {isSendingEmail ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-5 w-5" />
                      )}
                      {isSendingEmail ? "Enviando..." : "Enviar Fechamento"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>

      {/* Menu Mobile Inteligente */}
      <MobileBottomNav
        items={mobileNavItems}
        activeId={activeTab}
        onChange={setActiveTab}
      />
    </>
  );
}
