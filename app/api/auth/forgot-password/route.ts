import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, generateRandomPassword } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-mail é obrigatório" },
        { status: 400 }, // <-- Correção feita aqui, removidas as aspas ''
      );
    }

    // Busca o admin no banco
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    // 🔥 SEGURANÇA: Sempre retorna sucesso (mesmo se o e-mail não existir)
    // Isso evita que hackers descubram quais e-mails estão cadastrados
    if (!admin) {
      return NextResponse.json({
        success: true,
        message:
          "Se o e-mail estiver cadastrado, você receberá uma nova senha.",
      });
    }

    // Verifica se a conta está ativa
    if (!admin.email_verified) {
      return NextResponse.json(
        {
          error:
            "Sua conta ainda não foi ativada. Verifique seu e-mail primeiro.",
        },
        { status: 403 },
      );
    }

    // 🔥 GERA SENHA TEMPORÁRIA
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Atualiza a senha no banco
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
      },
    });

    // 📧 ENVIA E-MAIL COM A SENHA TEMPORÁRIA
    const emailResult = await sendPasswordResetEmail(email, tempPassword);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Erro ao enviar e-mail. Tente novamente." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Nova senha enviada para o seu e-mail!",
    });
  } catch (error) {
    console.error("Erro na recuperação de senha:", error);
    return NextResponse.json(
      { error: "Erro no servidor. Tente novamente mais tarde." },
      { status: 500 },
    );
  }
}
