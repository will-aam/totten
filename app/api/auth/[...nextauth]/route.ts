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

        if (!admin || !admin.organizations.length) {
          throw new Error("Usuário não encontrado");
        }

        if (!admin.email_verified) {
          throw new Error(
            "E-mail não verificado. Verifique sua caixa de entrada.",
          );
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          admin.password,
        );

        if (!isValidPassword) {
          throw new Error("Senha incorreta");
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.display_name || admin.email,
          organizationId: admin.organizations[0].id,
          organizationName: admin.organizations[0].name,
          organizationSlug: admin.organizations[0].slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
        token.organizationName = (user as any).organizationName;
        token.organizationSlug = (user as any).organizationSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
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
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
