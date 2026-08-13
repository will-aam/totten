// lib/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

/**
 * Ã°Å¸â€Â ObtÃƒÂ©m a sessÃƒÂ£o do usuÃƒÂ¡rio logado (usar em Server Components e API Routes)
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Ã°Å¸Â§â€˜Ã¢â‚¬ÂÃ°Å¸â€™Â¼ Retorna os dados do Admin logado (incluindo organization_id, role e permissions)
 * Retorna null se nÃƒÂ£o houver sessÃƒÂ£o ativa
 */
export async function getCurrentAdmin() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as any).role || "OWNER",
    permissions: (session.user as any).permissions || [], //  ADICIONADO
    organizationId: session.user.organizationId,
    organizationName: session.user.organizationName,
  };
}

// Adicione esta classe no arquivo para ajudar as rotas API a identificarem o 401
export class AuthError extends Error {
  constructor(message = "NÃƒÂ£o autorizado") {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Ã°Å¸â€ºÂ¡Ã¯Â¸Â Garante que hÃƒÂ¡ um admin logado ou lanÃƒÂ§a erro AuthError (401)
 * Use em Server Actions e API Routes que exigem autenticaÃƒÂ§ÃƒÂ£o
 */
export async function requireAuth() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new AuthError();
  }

  return admin;
}

