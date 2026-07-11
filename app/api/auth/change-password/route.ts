// app/api/auth/change-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // Valida a sessão ativa
    const admin = await requireAuth();

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Preencha todos os campos" },
        { status: 400 },
      );
    }

    // Busca o registro completo para obter o hash atual
    const adminData = await prisma.admin.findUnique({
      where: { id: admin.id },
    });

    if (!adminData) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Compara a senha informada com o hash armazenado
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      adminData.password,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 401 },
      );
    }

    // Gera o salt/hash da nova credencial
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Persiste a nova senha
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    });
  } catch (error) {
    // Intercepta falha de autorização e responde com 401 estruturado
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[CHANGE_PASSWORD_POST]", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
