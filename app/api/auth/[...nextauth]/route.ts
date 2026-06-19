// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("👉 1. Iniciando login para o email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Erro: Credenciais vazias");
          throw new Error("Credenciais inválidas");
        }

        try {
          console.log("👉 2. Buscando usuário no Prisma/Neon...");
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email },
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

          //  NOVA TRAVA: Bloqueia acesso se a dona desativou a colaboradora
          if (!admin.active) {
            console.log("❌ Erro: Usuário desativado");
            throw new Error(
              "Sua conta foi desativada. Fale com a administração.",
            );
          }

          console.log("👉 4. Comparando senhas com Bcrypt...");
          const isValidPassword = await bcrypt.compare(
            credentials.password,
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
            permissions: admin.permissions || [], //  PEGA DO BANCO
            organizationId: admin.organizations[0].id,
            organizationName: admin.organizations[0].name,
            organizationSlug: admin.organizations[0].slug,
          };
        } catch (error) {
          console.error(" ERRO FATAL NO AUTHORIZE:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions; //  SALVANDO NO TOKEN
        token.organizationId = (user as any).organizationId;
        token.organizationName = (user as any).organizationName;
        token.organizationSlug = (user as any).organizationSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.permissions = (token.permissions as string[]) || []; //  ENVIANDO PRO FRONTEND
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.organizationSlug = token.organizationSlug as string;
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
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
