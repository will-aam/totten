// app/actions/reports.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendClosingReportEmail } from "@/lib/email";

export async function getReportsData() {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;
    const now = new Date();

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        date_time: { gte: sixMonthsAgo },
      },
      include: { service: true },
    });

    const manualTransactions = await prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        status: "PAGO",
        date: { gte: sixMonthsAgo },
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
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      // 🔥 Adicionamos 'agendamentos' aqui para o novo gráfico de desempenho
      monthlyDataMap.set(key, {
        month: label,
        receitas: 0,
        despesas: 0,
        agendamentos: 0,
      });
    }

    appointments.forEach((a) => {
      const d = new Date(a.date_time);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyDataMap.has(key)) {
        const entry = monthlyDataMap.get(key);
        entry.agendamentos += 1; // Conta 1 agendamento
        if (a.payment_method) entry.receitas += Number(a.service.price);
        if (a.service.material_cost)
          entry.despesas += Number(a.service.material_cost);
      }
    });

    manualTransactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyDataMap.has(key)) {
        const entry = monthlyDataMap.get(key);
        if (t.type === "RECEITA") entry.receitas += Number(t.amount);
        if (t.type === "DESPESA") entry.despesas += Number(t.amount);
      }
    });

    const serviceMap = new Map();
    appointments.forEach((a) => {
      const sName = a.service.name;
      if (!serviceMap.has(sName)) {
        serviceMap.set(sName, { name: sName, faturamento: 0, sessoes: 0 });
      }
      const sData = serviceMap.get(sName);
      sData.sessoes += 1;
      if (a.payment_method) sData.faturamento += Number(a.service.price);
    });

    const topServices = Array.from(serviceMap.values())
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

// Adicione isso lá no final de app/actions/reports.ts
export async function sendMonthlyReport(
  month: number,
  year: number,
  emailTo: string,
) {
  try {
    const admin = await requireAuth();
    const organizationId = admin.organizationId;

    // Pega o início e o fim exato do mês selecionado
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        organization_id: organizationId,
        status: "REALIZADO",
        date_time: { gte: monthStart, lte: monthEnd },
      },
      include: { service: true },
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        organization_id: organizationId,
        status: "PAGO",
        date: { gte: monthStart, lte: monthEnd },
      },
    });

    // Calcula os totais do mês exato
    let receitas = 0;
    let despesas = 0;
    const agendamentos = appointments.length;

    appointments.forEach((a) => {
      if (a.payment_method) receitas += Number(a.service.price);
      if (a.service.material_cost) despesas += Number(a.service.material_cost);
    });

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
  } catch (error) {
    console.error("Erro no envio do fechamento:", error);
    return { success: false, error: "Falha na geração do relatório." };
  }
}
