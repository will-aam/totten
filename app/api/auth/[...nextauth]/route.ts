// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthService } from "@/lib/server/services/auth/auth.service";

import { authOptions } from "@/lib/auth-options";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
