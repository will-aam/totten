// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Renomeado para 'proxy' conforme convenção do Next 16
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔥 ROTAS PÚBLICAS EXATAS (só permite se for estritamente igual)
  const exactPublicPaths = ["/"];

  // 🔥 ROTAS PÚBLICAS POR PREFIXO (permite se começar com esses caminhos)
  const prefixPublicPaths = [
    "/totem/idle",
    "/totem/check-in",
    "/totem/success",
    "/totem/error",
    "/admin/login",
    "/admin/register",
    "/forgot-password",
    "/check-email",
    "/verify-email",
    "/api/auth",
    "/api/totem",
    "/api/settings/public",
  ];

  // Verifica se a rota bate com a exata OU com algum dos prefixos
  const isPublicPath =
    exactPublicPaths.includes(pathname) ||
    prefixPublicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 🔒 ROTAS PROTEGIDAS: Verifica se tem token de autenticação
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Se não tem token e está tentando acessar rota protegida
  if (!token && pathname.startsWith("/admin")) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
