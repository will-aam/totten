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

    // Redireciona para o login com sucesso
    redirect("/login?verified=true");
  } catch (error) {
    console.error("Erro na verificação:", error);
    redirect("/login?error=server_error");
  }
}
