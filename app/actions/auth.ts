// app/actions/auth.ts
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { requireAuth } from "@/lib/auth";
import { sendPasswordResetEmail, generateRandomPassword } from "@/lib/email";

export type ActionState = {
  error: string;
};

export async function registerAdmin(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const displayName = formData.get("displayName") as string;
  const companyName = formData.get("companyName") as string;
  const document = formData.get("document") as string;
  const contactPhone = formData.get("contactPhone") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !companyName || !document) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return { error: "Este e-mail já está em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //  GERA TOKEN DE VERIFICAÇÃO
    const verificationToken = randomBytes(32).toString("hex");

    const baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${randomSuffix}`;

    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: companyName,
          slug: slug,
          settings: {
            create: {
              company_name: companyName,
              document: document,
              phone_landline: contactPhone,
              phone_whatsapp: "",
            },
          },
        },
      });

      //  CRIA ADMIN COM CONTA INATIVA
      await tx.admin.create({
        data: {
          display_name: displayName,
          email: email,
          password: hashedPassword,
          email_verified: false, //  INATIVO
          verification_token: verificationToken, //  TOKEN
          organizations: {
            connect: { id: org.id },
          },
        },
      });
    });

    //  ENVIA E-MAIL DE CONFIRMAÇÃO
    await sendVerificationEmail(email, verificationToken);
  } catch (error) {
    console.error("Erro no registro:", error);
    return { error: "Ocorreu um erro ao criar a conta. Tente novamente." };
  }

  //  REDIRECIONA PARA PÁGINA DE AVISO
  redirect("/check-email");
}
export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  try {
    // 🛡️ Garante que há uma sessão válida e extrai os dados do admin logado
    const admin = await requireAuth();

    if (!currentPassword || !newPassword) {
      return { error: "Preencha todos os campos" };
    }

    // Busca o registro completo para obter o hash atual
    const adminData = await prisma.admin.findUnique({
      where: { id: admin.id },
    });

    if (!adminData) {
      return { error: "Usuário não encontrado" };
    }

    // Compara a senha informada com o hash armazenado
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      adminData.password,
    );

    if (!isValidPassword) {
      return { error: "Senha atual incorreta" };
    }

    // Gera o salt/hash da nova credencial
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Persiste a nova senha
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Senha alterada com sucesso" };
  } catch (error: any) {
    if (error.name === "AuthError" || error.message === "Não autorizado") {
      return { error: "Sessão expirada ou não autorizado" };
    }

    console.error("[ACTION changePassword] ERRO:", error);
    return { error: "Erro interno do servidor" };
  }
}

export async function forgotPassword(email: string) {
  try {
    if (!email) {
      return { error: "E-mail é obrigatório" };
    }

    // Busca o admin no banco
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    // SEGURANÇA: Sempre retorna sucesso (mesmo se o e-mail não existir)
    // Isso evita que hackers descubram quais e-mails estão cadastrados
    if (!admin) {
      return {
        success: true,
        message:
          "Se o e-mail estiver cadastrado, você receberá uma nova senha.",
      };
    }

    // Verifica se a conta está ativa
    if (!admin.email_verified) {
      return {
        error:
          "Sua conta ainda não foi ativada. Verifique seu e-mail primeiro.",
      };
    }

    // GERA SENHA TEMPORÁRIA
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Atualiza a senha no banco
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
      },
    });

    // ENVIA E-MAIL COM A SENHA TEMPORÁRIA
    const emailResult = await sendPasswordResetEmail(email, tempPassword);

    if (!emailResult.success) {
      return { error: "Erro ao enviar e-mail. Tente novamente." };
    }

    return {
      success: true,
      message: "Nova senha enviada para o seu e-mail!",
    };
  } catch (error) {
    console.error("[ACTION forgotPassword] ERRO:", error);
    return { error: "Erro no servidor. Tente novamente mais tarde." };
  }
}
