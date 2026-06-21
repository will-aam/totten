import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

function isDevEmailLoginEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_EMAIL_LOGIN === "true"
  );
}

// opcional: restringe a localhost. Em Next/Node, IP pode variar conforme proxy.
// Em dev geralmente funciona bem; se te bloquear, você pode remover essa checagem.
function isLocalhostRequest(req: any) {
  try {
    // NextAuth passa um "req" estilo Request/NextRequest em App Router
    // mas pode variar. Vamos checar headers comuns.
    const forwardedFor =
      req?.headers?.get?.("x-forwarded-for") ||
      req?.headers?.["x-forwarded-for"];
    const realIp =
      req?.headers?.get?.("x-real-ip") || req?.headers?.["x-real-ip"];

    const ip = (realIp || forwardedFor || "").split(",")[0].trim();

    // se não veio IP (comum em dev), a gente deixa passar
    if (!ip) return true;

    return ip === "127.0.0.1" || ip === "::1";
  } catch {
    return true;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        // Continuamos exibindo o campo senha no form,
        // mas em DEV vamos permitir vazio.
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        const email = credentials?.email?.trim()?.toLowerCase();
        const password = credentials?.password ?? "";

        console.log("👉 1. Iniciando login para o email:", email);

        if (!email) {
          console.log("❌ Erro: Email vazio");
          throw new Error("Credenciais inválidas");
        }

        // 🔐 Se quiser travar ainda mais, só permitir o bypass quando a requisição for local
        const allowDevEmailLogin =
          isDevEmailLoginEnabled() && isLocalhostRequest(req);

        try {
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
            throw new Error(
              "E-mail não verificado. Verifique sua caixa de entrada.",
            );
          }

          // 🔥 TRAVA: Bloqueia acesso se a dona desativou a colaboradora
          if (!admin.active) {
            console.log("❌ Erro: Usuário desativado");
            throw new Error(
              "Sua conta foi desativada. Fale com a administração.",
            );
          }

          // ✅ BYPASS DEV: se senha vier vazia, autentica só com e-mail (APENAS DEV/LOCAL)
          if (allowDevEmailLogin && password.length === 0) {
            console.log(
              "🧪 DEV LOGIN: autenticando sem senha (apenas e-mail).",
            );

            return {
              id: admin.id,
              email: admin.email,
              name: admin.display_name || admin.email,
              role: admin.role,
              permissions: admin.permissions || [], // 🔥 PEGA DO BANCO
              organizationId: admin.organizations[0].id,
              organizationName: admin.organizations[0].name,
              organizationSlug: admin.organizations[0].slug,
            };
          }

          // 🔒 Fluxo normal: exige senha
          if (!password) {
            console.log("❌ Erro: Senha vazia");
            throw new Error("Credenciais inválidas");
          }

          console.log("👉 4. Comparando senhas com Bcrypt...");
          const isValidPassword = await bcrypt.compare(
            password,
            admin.password,
          );

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
            permissions: admin.permissions || [], // 🔥 PEGA DO BANCO
            organizationId: admin.organizations[0].id,
            organizationName: admin.organizations[0].name,
            organizationSlug: admin.organizations[0].slug,
          };
        } catch (error) {
          console.error("🔥 ERRO FATAL NO AUTHORIZE:", error);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
        token.organizationId = (user as any).organizationId;
        token.organizationName = (user as any).organizationName;
        token.organizationSlug = (user as any).organizationSlug;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        // Observação: isso assume que você já estendeu o tipo de session.user
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).permissions =
          (token.permissions as string[]) || [];
        (session.user as any).organizationId = token.organizationId as string;
        (session.user as any).organizationName =
          token.organizationName as string;
        (session.user as any).organizationSlug =
          token.organizationSlug as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/admin/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
