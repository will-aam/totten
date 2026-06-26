// app/api/cron/route.ts
import { NextResponse } from "next/server";
import { processDailyNoShows } from "@/app/actions/appointments";

export async function GET(request: Request) {
  try {
    // 1. Extrair a chave de segurança
    // O Vercel Cron envia a chave no cabeçalho 'Authorization: Bearer <CRON_SECRET>'
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader ? authHeader.split(" ")[1] : null;

    // Em alternativa, permitimos passar a chave pelo URL para facilitar testes manuais
    // Exemplo: /api/cron?secret=minhachavesecreta
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");

    const secretKey = bearerToken || querySecret || undefined;

    // 2. Executar a ação de processamento
    const result = await processDailyNoShows(secretKey);

    // 3. Devolver a resposta adequada com base no resultado
    if (!result.success) {
      // Se falhar (por exemplo, chave incorreta), retornamos erro 401 (Não Autorizado) ou 400
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Se correr bem, retornamos sucesso e a quantidade de faltas processadas
    return NextResponse.json(
      {
        message: "Processamento de faltas concluído com sucesso.",
        processed_count: result.processed,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro interno na rota do Cron Job:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar o cron job." },
      { status: 500 },
    );
  }
}
