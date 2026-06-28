// app/verify-email/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/login?error=invalid_token");
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { verification_token: token },
    });

    if (!admin) {
      redirect("/login?error=invalid_token");
    }

    // ATIVA A CONTA
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        email_verified: true,
        verification_token: null,
      },
    });

    // app/verify-email/page.tsx (apenas o catch)
  } catch (error: any) {
    // Isso vai mostrar no log da Vercel o erro real (ex: uma conexão de banco, um problema de redirect, etc)
    console.error("DEBUG - Erro detalhado na verificação:", {
      message: error.message,
      stack: error.stack,
    });
    redirect("/login?error=server_error");
  }
}
