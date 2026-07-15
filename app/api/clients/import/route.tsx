// app/api/clients/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

// As mesmas máscaras usadas no frontend para garantir padrão no banco!
function formatCpfInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ✅ Padronizado para NextRequest
export async function POST(request: NextRequest) {
  try {
    // ✅ Padronizado para requireAuth (lança AuthError se falhar)
    const admin = await requireAuth();

    const body = await request.json();
    const clientsData = body.clients;

    if (!Array.isArray(clientsData) || clientsData.length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado válido enviado." },
        { status: 400 },
      );
    }

    // Formata e prepara os dados
    const dataToInsert = clientsData.map((client: any) => {
      // Converte data que vem da planilha (DD/MM/AAAA) para Date do banco
      let formattedDate = null;
      if (client.birth_date) {
        const dateStr = String(client.birth_date).replace(/\D/g, ""); // "10051990"
        if (dateStr.length === 8) {
          const day = dateStr.slice(0, 2);
          const month = dateStr.slice(2, 4);
          const year = dateStr.slice(4, 8);
          // Usa T12 para evitar erro de fuso horário igual no cadastro
          formattedDate = new Date(`${year}-${month}-${day}T12:00:00Z`);
        }
      }

      return {
        organization_id: admin.organizationId,
        active: true,
        name: client.name || "Cliente Sem Nome",
        cpf: formatCpfInput(client.cpf || ""),
        phone_whatsapp: formatPhoneInput(client.phone_whatsapp || ""),
        email: client.email || null,
        zip_code: client.zip_code || null,
        city: client.city || null,
        street: client.street || null,
        number: client.number || null,
        birth_date: formattedDate,
      };
    });

    // Filtra apenas clientes que pelo menos tenham CPF e Nome preenchidos
    const validData = dataToInsert.filter((c) => c.cpf.length >= 14 && c.name);

    // Faz o INSERT MÚLTIPLO! O skipDuplicates ignora quem já está cadastrado com aquele CPF
    const result = await prisma.client.createMany({
      data: validData,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      imported: result.count,
      skipped: validData.length - result.count,
    });
  } catch (error: any) {
    // ✅ Tratamento centralizado do erro de autenticação
    if (error instanceof AuthError || error.name === "AuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Erro na importação:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao importar." },
      { status: 500 },
    );
  }
}
