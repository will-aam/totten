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
  const displayName = ((formData.get("displayName") as string) || "").trim();
  const companyName = ((formData.get("companyName") as string) || "").trim();
  const document = ((formData.get("document") as string) || "").trim();
  const contactPhone = ((formData.get("contactPhone") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").toLowerCase().trim();
  const password = (formData.get("password") as string) || "";

  if (!displayName) {
    return { error: "Informe o seu nome completo." };
  }

  if (!companyName) {
    return { error: "Informe o nome da sua empresa / clínica." };
  }

  const cleanDoc = document.replace(/\D/g, "");
  if (!cleanDoc || (cleanDoc.length !== 11 && cleanDoc.length !== 14)) {
    return { error: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido." };
  }

  const cleanPhone = contactPhone.replace(/\D/g, "");
  if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { error: "Informe um telefone/WhatsApp de contato válido com DDD." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { error: "Informe um endereço de e-mail válido." };
  }

  if (!password || password.length < 8) {
    return { error: "A senha deve ter no mínimo 8 caracteres." };
  }

  try {
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
    });

    if (existingAdmin) {
      return { error: "Este e-mail já está em uso." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // GERA TOKEN DE VERIFICAÇÃO
    const verificationToken = randomBytes(32).toString("hex");

    const baseSlug = companyName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug || "clinica"}-${randomSuffix}`;

    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: companyName,
          slug: slug,
          settings: {
            create: {
              company_name: companyName,
              trade_name: companyName,
              document: document,
              responsible_name: displayName,
              phone_landline: contactPhone,
              phone_whatsapp: contactPhone, // Inicializa corretamente com o WhatsApp principal
              email_admin: email,
            },
          },
        },
      });

      // CRIA ADMIN COM CONTA INATIVA
      await tx.admin.create({
        data: {
          display_name: displayName,
          email: email,
          password: hashedPassword,
          email_verified: false,
          verification_token: verificationToken,
          organizations: {
            connect: { id: org.id },
          },
        },
      });
    });

    // ENVIA E-MAIL DE CONFIRMAÇÃO
    await sendVerificationEmail(email, verificationToken);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "Este e-mail já está em uso." };
    }
    console.error("Erro no registro:", error);
    return { error: "Ocorreu um erro ao criar a conta. Tente novamente." };
  }

  // REDIRECIONA PARA PÁGINA DE AVISO
  redirect("/check-email");
}

export async function resendVerificationEmail(email: string) {
  try {
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, error: "Informe o seu e-mail de acesso." };
    }

    const admin = await prisma.admin.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
      },
    });

    if (!admin) {
      // Resposta genérica segura para proteção contra enumeração de e-mails
      return {
        success: true,
        message: "Se o e-mail estiver cadastrado e pendente de ativação, o link foi reenviado com sucesso.",
      };
    }

    if (admin.email_verified) {
      return {
        success: false,
        error: "Esta conta já foi ativada. Você pode fazer login normalmente.",
      };
    }

    const verificationToken = randomBytes(32).toString("hex");

    await prisma.admin.update({
      where: { id: admin.id },
      data: { verification_token: verificationToken },
    });

    await sendVerificationEmail(admin.email, verificationToken);

    return {
      success: true,
      message: "Novo link de ativação enviado para o seu e-mail! Verifique sua caixa de entrada.",
    };
  } catch (error) {
    console.error("[resendVerificationEmail] Erro:", error);
    return {
      success: false,
      error: "Erro ao reenviar e-mail de ativação. Tente novamente mais tarde.",
    };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  try {
    const admin = await requireAuth();

    if (!currentPassword || !newPassword) {
      return { error: "Preencha todos os campos" };
    }

    const adminData = await prisma.admin.findUnique({
      where: { id: admin.id },
    });

    if (!adminData) {
      return { error: "Usuário não encontrado" };
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      adminData.password,
    );

    if (!isValidPassword) {
      return { error: "Senha atual incorreta" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

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
    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) {
      return { error: "E-mail é obrigatório" };
    }

    const admin = await prisma.admin.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
      },
    });

    if (!admin) {
      return {
        success: true,
        message: "Se o e-mail estiver cadastrado, você receberá uma nova senha.",
      };
    }

    if (!admin.email_verified) {
      return {
        error: "Sua conta ainda não foi ativada. Verifique seu e-mail primeiro.",
      };
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
      },
    });

    const emailResult = await sendPasswordResetEmail(admin.email, tempPassword);

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
