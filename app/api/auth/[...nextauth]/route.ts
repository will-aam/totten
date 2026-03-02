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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais inválidas");
        }

        // Busca admin com suas organizações
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
          include: {
            organizations: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
              take: 1, // Pega a primeira organização do admin
            },
          },
        });

        if (!admin || !admin.organizations.length) {
          throw new Error("Usuário não encontrado");
        }

        // 🔥 BLOQUEIA SE E-MAIL NÃO VERIFICADO
        if (!admin.email_verified) {
          throw new Error(
            "E-mail não verificado. Verifique sua caixa de entrada.",
          );
        }

        // Valida a senha
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          admin.password,
        );

        if (!isValidPassword) {
          throw new Error("Senha incorreta");
        }

        // Retorna dados que vão para a sessão
        return {
          id: admin.id,
          email: admin.email,
          name: admin.display_name || admin.email,
          organizationId: admin.organizations[0].id,
          organizationName: admin.organizations[0].name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Injeta organizationId no token JWT na primeira vez
      if (user) {
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
        token.organizationName = (user as any).organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      // Injeta organizationId na sessão disponível no client/server
      if (token) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
