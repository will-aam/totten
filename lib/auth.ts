import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * 🔐 Obtém a sessão do usuário logado (usar em Server Components e API Routes)
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * 🧑‍💼 Retorna os dados do Admin logado (incluindo organization_id, role e permissions)
 * Retorna null se não houver sessão ativa
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
    permissions: (session.user as any).permissions || [], // 🔥 ADICIONADO
    organizationId: session.user.organizationId,
    organizationName: session.user.organizationName,
  };
}

/**
 * 🛡️ Garante que há um admin logado ou lança erro 401
 * Use em API Routes que exigem autenticação
 */
export async function requireAuth() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error("Unauthorized");
  }

  return admin;
}
