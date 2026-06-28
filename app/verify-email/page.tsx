// app/verify-email/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const { token } = await searchParams;

  // 1. Validação inicial fora do try/catch
  if (!token) {
    redirect("/login?error=invalid_token");
  }

  // 2. Tenta encontrar o usuário e atualizar
  try {
    const admin = await prisma.admin.findUnique({
      where: { verification_token: token },
    });

    if (!admin) {
      // Se não achar o token, redireciona direto (fora do bloco de erro de banco)
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
  } catch (error) {
    // Aqui só caem erros de banco de dados ou rede
    console.error("Erro no banco durante verificação:", error);
    redirect("/login?error=server_error");
  }

  // 3. Se chegou aqui, deu tudo certo!
  redirect("/login?verified=true");
}
