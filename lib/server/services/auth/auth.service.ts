// lib/server/services/auth/auth.service.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export class AuthService {
  /**
   * Valida as credenciais do usuário, verifica restrições de conta
   * e retorna o objeto formatado para a sessão do NextAuth.
   */
  static async validateCredentials(email?: string, password?: string) {
    console.log("👉 1. Iniciando login para o email:", email);

    if (!email || !password) {
      console.log("❌ Erro: Credenciais vazias");
      throw new Error("Credenciais inválidas");
    }

    console.log("👉 2. Buscando usuário no Prisma/Neon...");
    const admin = await prisma.admin.findUnique({
      where: { email },
      include: {
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
          take: 1,
        },
      },
    });

    console.log(
      "👉 3. Resposta do Prisma:",
      admin ? "Usuário Encontrado" : "Usuário NÃO encontrado",
    );

    if (!admin || !admin.organizations.length) {
      console.log("❌ Erro: Usuário não existe ou não tem organização");
      throw new Error("Usuário não encontrado");
    }

    if (!admin.email_verified) {
      console.log("❌ Erro: E-mail não verificado");
      throw new Error("E-mail não verificado. Verifique sua caixa de entrada.");
    }

    // NOVA TRAVA: Bloqueia acesso se a dona desativou a colaboradora
    if (!admin.active) {
      console.log("❌ Erro: Usuário desativado");
      throw new Error("Sua conta foi desativada. Fale com a administração.");
    }

    console.log("👉 4. Comparando senhas com Bcrypt...");
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      console.log("❌ Erro: Senha incorreta");
      throw new Error("Senha incorreta");
    }

    console.log("✅ 5. Sucesso! Retornando sessão com role:", admin.role);

    return {
      id: admin.id,
      email: admin.email,
      name: admin.display_name || admin.email,
      role: admin.role,
      permissions: admin.permissions || [], // PEGA DO BANCO
      organizationId: admin.organizations[0].id,
      organizationName: admin.organizations[0].name,
      organizationSlug: admin.organizations[0].slug,
    };
  }
}
