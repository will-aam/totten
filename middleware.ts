import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔥 ROTAS PÚBLICAS (não precisam de autenticação)
  const publicPaths = [
    "/",
    "/totem/idle",
    "/totem/check-in",
    "/totem/success",
    "/totem/error",
    "/admin/login",
    "/admin/register",
    "/admin/forgot-password",
    "/check-email",
    "/verify-email",
    "/api/auth",
    "/api/totem",
    "/api/settings/public",
  ];

  // Verifica se a rota é pública
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

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
