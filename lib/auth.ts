// lib/auth.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export interface AuthenticatedAdmin {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  permissions: string[];
  isSystemOwner?: boolean;
  organizationId: string;
  organizationName?: string | null;
}

/**
 * 🔑 Obtém a sessão do usuário logado (usar em Server Components e API Routes)
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * 🧑‍💼 Retorna os dados do Admin logado (incluindo organization_id, role, permissions e isSystemOwner)
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
    permissions: ((session.user as any).permissions as string[]) || [],
    isSystemOwner: (session.user as any).isSystemOwner ?? false,
    organizationId: session.user.organizationId,
    organizationName: session.user.organizationName,
  };
}

// Classe de erro para identificar falhas de autenticação (401)
export class AuthError extends Error {
  constructor(message = "Não autorizado") {
    super(message);
    this.name = "AuthError";
  }
}

// Classe de erro para identificar acessos proibidos por RBAC (403)
export class ForbiddenError extends Error {
  constructor(message = "Acesso negado: permissão financeira necessária") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * 🛡️ Verifica se o usuário possui acesso ao módulo financeiro (OWNER ou permissão FINANCE)
 */
export function hasFinancePermission(admin: {
  role?: string;
  permissions?: string[];
}): boolean {
  if (admin.role === "OWNER") {
    return true;
  }
  return Array.isArray(admin.permissions) && admin.permissions.includes("FINANCE");
}

/**
 * 🛡️ Garante que há um admin logado ou lança erro AuthError (401)
 * Use em Server Actions e API Routes que exigem autenticação
 */
export async function requireAuth(): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdmin();

  if (!admin || !admin.organizationId) {
    throw new AuthError("Não autorizado ou organização não selecionada");
  }

  return admin as AuthenticatedAdmin;
}

/**
 * 🔒 Garante que há um admin logado COM permissão financeira (OWNER ou permissão FINANCE).
 * Lança AuthError (401) se não autenticado ou ForbiddenError (403) se não autorizado.
 */
export async function requireFinancePermission(): Promise<AuthenticatedAdmin> {
  const admin = await requireAuth();

  if (!hasFinancePermission(admin)) {
    throw new ForbiddenError("Acesso negado: permissão financeira necessária");
  }

  return admin;
}

/**
 * 👑 Garante que há um admin logado com permissão exclusiva de Dono do Sistema (Master).
 * Valida a sessão e realiza checagem em tempo real contra o banco de dados.
 */
export async function requireSystemOwner(): Promise<AuthenticatedAdmin> {
  const admin = await requireAuth();

  // 1. Verificação instantânea por ID e E-mail do Administrador Master
  const isMasterIdentity =
    admin.id === "cmw6jrhek0003cgxgoznhpzm6" ||
    admin.email?.toLowerCase() === "tottenappbr@gmail.com";

  if (isMasterIdentity) {
    return { ...admin, isSystemOwner: true };
  }

  // 2. Verificação no banco de dados via consulta direta em SQL (independente de cache do cliente)
  const { prisma } = await import("@/lib/prisma");
  try {
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT is_system_owner FROM admins WHERE id = $1 LIMIT 1`,
      admin.id
    );
    if (rows?.[0]?.is_system_owner === true) {
      return { ...admin, isSystemOwner: true };
    }
  } catch (err) {
    console.error("[requireSystemOwner] Erro ao validar permissão master:", err);
  }

  throw new ForbiddenError("Acesso restrito ao Administrador Geral da Plataforma.");
}
