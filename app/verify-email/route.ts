import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid_token", request.url),
    );
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { verification_token: token },
    });

    if (!admin) {
      return NextResponse.redirect(
        new URL("/admin/login?error=invalid_token", request.url),
      );
    }

    // ✅ ATIVA A CONTA
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        email_verified: true,
        verification_token: null, // Remove o token
      },
    });

    return NextResponse.redirect(
      new URL("/admin/login?verified=true", request.url),
    );
  } catch (error) {
    console.error("Erro na verificação:", error);
    return NextResponse.redirect(
      new URL("/admin/login?error=server_error", request.url),
    );
  }
}
