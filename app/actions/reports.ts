// app/actions/reports.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireFinancePermission } from "@/lib/auth";
import { sendClosingReportEmail } from "@/lib/email";
import {
  getBrasiliaDateParts,
  getBrasiliaMonthRange,
} from "@/lib/date-utils";

export async function getReportsData() {
  try {
    const admin = await requireFinancePermission();
    const organizationId = admin.organizationId;
    const nowParts = getBrasiliaDateParts();

    let startMonth = nowParts.month - 5;
    let startYear = nowParts.year;
    while (startMonth < 1) {
      startMonth += 12;
      startYear -= 1;
    }
    const { monthStart: sixMonthsAgo } = getBrasiliaMonthRange(
      startYear,
      startMonth,
    );

    const appointments = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        date_time: { gte: sixMonthsAgo },
      },
      include: {
        service: true,
        package: true,
        transactions: true,
      },
    });

    const paidTransactions = await prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        status: "PAGO",
        date: { gte: sixMonthsAgo },
        NOT: {
          type: "RECEITA",
          appointment: {
            package_id: { not: null },
          },
        },
      },
      include: {
        appointment: {
          select: {
            snapshot_service_name: true,
            service: { select: { name: true } },
          },
        },
        package: {
          select: {
            snapshot_service_name: true,
            name: true,
            service: { select: { name: true } },
          },
        },
      },
    });

    const monthlyDataMap = new Map();
    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    for (let i = 5; i >= 0; i--) {
      let m = nowParts.month - i;
      let y = nowParts.year;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      const key = `${y}-${m}`;
      const label = `${monthNames[m - 1]}/${String(y).slice(-2)}`;
      //  Adicionamos 'agendamentos' aqui para o novo gráfico de desempenho
      monthlyDataMap.set(key, {
        month: label,
        receitas: 0,
        despesas: 0,
        agendamentos: 0,
      });
    }

    // Mapa de sessões/atendimentos realizados por serviço
    const serviceSessionsMap = new Map<string, number>();

    appointments.forEach((a) => {
      const p = getBrasiliaDateParts(a.date_time);
      const key = `${p.year}-${p.month}`;
      if (monthlyDataMap.has(key)) {
        const entry = monthlyDataMap.get(key);
        entry.agendamentos += 1; // Conta 1 agendamento realizado
      }

      const sName = a.snapshot_service_name || a.service?.name || "Serviço";
      serviceSessionsMap.set(sName, (serviceSessionsMap.get(sName) || 0) + 1);
    });

    paidTransactions.forEach((t) => {
      const p = getBrasiliaDateParts(t.date);
      const key = `${p.year}-${p.month}`;
      if (monthlyDataMap.has(key)) {
        const entry = monthlyDataMap.get(key);
        if (t.type === "RECEITA") entry.receitas += Number(t.amount);
        if (t.type === "DESPESA") entry.despesas += Number(t.amount);
      }
    });

    // REGIME DE CAIXA UNIFICADO:
    // O faturamento do Top Serviços utiliza as transações de receitas reais pagas no período,
    // garantindo total coerência contábil com o gráfico mensal e extratos financeiros.
    const serviceMap = new Map<
      string,
      { name: string; faturamento: number; sessoes: number }
    >();

    // Inicializa com as sessões realizadas de cada serviço
    serviceSessionsMap.forEach((sessoes, sName) => {
      serviceMap.set(sName, { name: sName, faturamento: 0, sessoes });
    });

    // Computa as receitas pagas que deram entrada no caixa
    paidTransactions.forEach((t) => {
      if (t.type !== "RECEITA") return;
      const amount = Number(t.amount);
      if (amount <= 0) return;

      let serviceName = "Outros Serviços";

      if (t.appointment) {
        serviceName =
          t.appointment.snapshot_service_name ||
          t.appointment.service?.name ||
          "Serviço Avulso";
      } else if (t.package) {
        serviceName =
          t.package.snapshot_service_name ||
          t.package.service?.name ||
          t.package.name ||
          "Pacote de Serviço";
      } else if (t.description) {
        serviceName = t.description;
      }

      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, {
          name: serviceName,
          faturamento: 0,
          sessoes: 0,
        });
      }

      const sData = serviceMap.get(serviceName)!;
      sData.faturamento += amount;
    });

    const topServices = Array.from(serviceMap.values())
      .map((s) => ({
        ...s,
        faturamento: Number(s.faturamento.toFixed(2)),
      }))
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 10); // Pegamos os Top 10 agora

    return {
      success: true,
      monthlyData: Array.from(monthlyDataMap.values()),
      topServices,
    };
  } catch (error) {
    console.error("Erro ao gerar relatórios:", error);
    return { success: false, monthlyData: [], topServices: [] };
  }
}

// Busca os anos e meses que realmente possuem dados financeiros (transações ou atendimentos)
export async function getClosingReportAvailablePeriods() {
  try {
    const admin = await requireFinancePermission();
    const organizationId = admin.organizationId;

    const [transactions, appointments] = await Promise.all([
      prisma.transaction.findMany({
        where: { organization_id: organizationId },
        select: { date: true },
      }),
      prisma.appointment.findMany({
        where: {
          organization_id: organizationId,
          status: "REALIZADO",
        },
        select: { date_time: true },
      }),
    ]);

    // Mapeia ano -> Set de meses
    // REGRA DE FECHAMENTO: Apenas meses que já fecharam (anteriores ao mês atual no fuso de Brasília)
    const nowParts = getBrasiliaDateParts();
    const currentYear = nowParts.year;
    const currentMonth = nowParts.month; // 1 a 12

    const periodsMap = new Map<number, Set<number>>();

    const addPeriod = (dateInput: Date | string) => {
      const p = getBrasiliaDateParts(dateInput);
      const year = p.year;
      const month = p.month; // 1 a 12

      // Ignora datas futuras ou do mês atual que ainda está em andamento
      if (year > currentYear || (year === currentYear && month >= currentMonth)) {
        return;
      }

      if (!periodsMap.has(year)) {
        periodsMap.set(year, new Set<number>());
      }
      periodsMap.get(year)!.add(month);
    };

    transactions.forEach((t) => addPeriod(t.date));
    appointments.forEach((a) => addPeriod(a.date_time));

    // Se ainda não houver nenhum mês fechado com dados históricos, sugere o mês anterior imediato como padrão
    if (periodsMap.size === 0) {
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
      }
      periodsMap.set(prevYear, new Set([prevMonth]));
    }

    const availableYears = Array.from(periodsMap.keys()).sort((a, b) => b - a);
    const availableMonthsByYear: Record<number, number[]> = {};

    availableYears.forEach((year) => {
      availableMonthsByYear[year] = Array.from(periodsMap.get(year)!).sort(
        (a, b) => a - b,
      );
    });

    return {
      success: true,
      availableYears,
      availableMonthsByYear,
      defaultEmail: admin.email || "",
    };
  } catch (error) {
    console.error("Erro ao buscar períodos disponíveis:", error);
    const nowParts = getBrasiliaDateParts();
    let fallbackMonth = nowParts.month - 1;
    let fallbackYear = nowParts.year;
    if (fallbackMonth < 1) {
      fallbackMonth = 12;
      fallbackYear -= 1;
    }
    return {
      success: false,
      availableYears: [fallbackYear],
      availableMonthsByYear: { [fallbackYear]: [fallbackMonth] },
      defaultEmail: "",
    };
  }
}

// Envia relatório de fechamento por e-mail
export async function sendMonthlyReport(
  month: number,
  year: number,
  emailTo: string,
) {
  try {
    const admin = await requireFinancePermission();
    const organizationId = admin.organizationId;

    // Pega o início e o fim exato do mês selecionado no fuso de Brasília
    const { monthStart, monthEnd } = getBrasiliaMonthRange(year, month);

    const appointments = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        date_time: { gte: monthStart, lte: monthEnd },
      },
      include: { service: true, transactions: true },
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        status: "PAGO",
        date: { gte: monthStart, lte: monthEnd },
        NOT: {
          type: "RECEITA",
          appointment: {
            package_id: { not: null },
          },
        },
      },
    });

    // Calcula os totais do mês exato
    let receitas = 0;
    let despesas = 0;
    const agendamentos = appointments.length;

    // Transações registradas no caixa (Fonte da Verdade)
    transactions.forEach((t) => {
      if (t.type === "RECEITA") receitas += Number(t.amount);
      if (t.type === "DESPESA") despesas += Number(t.amount);
    });

    const saldo = receitas - despesas;
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    const monthStr = monthNames[month - 1];

    // Dispara o e-mail usando o Resend!
    const res = await sendClosingReportEmail(emailTo, monthStr, String(year), {
      receitas,
      despesas,
      saldo,
      agendamentos,
    });

    if (!res.success) {
      throw new Error("Falha ao enviar e-mail via Resend.");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erro no envio do fechamento:", error);
    return {
      success: false,
      error: error?.message || "Falha na geração do relatório.",
    };
  }
}
