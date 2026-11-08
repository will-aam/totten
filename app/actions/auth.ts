// app/actions/auth.ts
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { requireAuth } from "@/lib/auth";
import { sendPasswordResetEmail, generateRandomPassword } from "@/lib/email";
import { toTitleCase } from "@/lib/utils";

export type ActionState = {
  error: string;
};

async function withDbRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1200): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isConnError =
        err?.name === "PrismaClientInitializationError" ||
        err?.message?.includes("Can't reach database server") ||
        err?.code === "P1001";
      if (isConnError && attempt < retries) {
        console.warn(
          `[registerAdmin] Banco em cold-start (tentativa ${attempt}/${retries}). Aguardando ${delayMs}ms para reconectar...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function registerAdmin(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const companyName = ((formData.get("companyName") as string) || "").trim();
  const firstName = ((formData.get("firstName") as string) || "").trim();
  const lastName = ((formData.get("lastName") as string) || "").trim();
  const rawDisplayName = ((formData.get("displayName") as string) || "").trim();
  const displayName = rawDisplayName || firstName;

  const document = ((formData.get("document") as string) || "").trim();
  const whatsapp = ((formData.get("whatsapp") as string) || (formData.get("contactPhone") as string) || "").trim();
  const contactPhone = ((formData.get("contactPhone") as string) || "").trim();
  const address = ((formData.get("address") as string) || "").trim();

  const email = ((formData.get("email") as string) || "").toLowerCase().trim();
  const confirmEmail = ((formData.get("confirmEmail") as string) || "").toLowerCase().trim();
  const password = (formData.get("password") as string) || "";

  if (!companyName || companyName.length < 2) {
    return { error: "O Nome Fantasia da empresa deve ter no mínimo 2 caracteres." };
  }

  // Validação estrita do primeiro nome (apenas 1 palavra, letras e acentos, sem números nem espaços)
  const nameRegex = /^[A-Za-zÀ-ÿ'-]{2,35}$/;
  if (!firstName || !nameRegex.test(firstName)) {
    return { error: "O primeiro nome deve conter apenas letras (sem sobrenome, espaços ou números) e ter no mínimo 2 caracteres." };
  }

  // Validação do sobrenome (apenas letras, acentos e espaços)
  const lastNameRegex = /^[A-Za-zÀ-ÿ' -]{2,80}$/;
  if (!lastName || !lastNameRegex.test(lastName)) {
    return { error: "O sobrenome deve conter apenas letras e ter no mínimo 2 caracteres." };
  }

  if (!displayName || displayName.length < 2) {
    return { error: "Informe como gostaria de ser chamado (mínimo 2 caracteres)." };
  }

  const cleanCpf = document.replace(/\D/g, "");
  const cleanCnpj = document.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const isCpf = cleanCpf.length === 11;
  const isCnpj = cleanCnpj.length === 14;

  if (!isCpf && !isCnpj) {
    return { error: "Informe um CPF (11 números) ou CNPJ válido (14 caracteres numéricos ou alfanuméricos)." };
  }

  const cleanWhatsApp = whatsapp.replace(/\D/g, "");
  if (!cleanWhatsApp || cleanWhatsApp.length !== 11) {
    return { error: "Informe um WhatsApp válido com DDD (11 números)." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 100) {
    return { error: "Informe um endereço de e-mail válido." };
  }

  if (confirmEmail && email !== confirmEmail) {
    return { error: "Os e-mails informados não coincidem." };
  }

  if (!password || password.length < 6) {
    return { error: "A senha deve ter no mínimo 6 caracteres." };
  }

  try {
    const existingAdmin = await withDbRetry(() =>
      prisma.admin.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
        },
      })
    );

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
    const slug = `${baseSlug || "empresa"}-${randomSuffix}`;
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 dias grátis

    const formattedCompanyName = toTitleCase(companyName);
    const formattedFirstName = toTitleCase(firstName);
    const formattedLastName = toTitleCase(lastName);
    const formattedDisplayName = toTitleCase(displayName);
    const formattedFullName = [formattedFirstName, formattedLastName].filter(Boolean).join(" ");
    const formattedAddress = address ? toTitleCase(address) : "";

    await withDbRetry(() =>
      prisma.$transaction(async (tx: any) => {
        // 1. Cria a Organização
        const org = await tx.organization.create({
          data: {
            name: formattedCompanyName,
            slug: slug,
            subscription_status: "TRIAL",
            plan: "ADVANCED",
            trial_ends_at: trialEndsAt,
          },
        });

        // 2. Cria as Configurações da Organização
        await tx.settings.create({
          data: {
            organization_id: org.id,
            company_name: formattedCompanyName,
            trade_name: formattedCompanyName,
            document: document,
            responsible_name: formattedFullName,
            responsible_first_name: formattedFirstName,
            responsible_last_name: formattedLastName,
            responsible_display_name: formattedDisplayName,
            phone_landline: contactPhone || "",
            phone_whatsapp: whatsapp,
            address: formattedAddress,
            email_admin: email,
          },
        });

        // 3. Cria Admin com Conta Inativa (aguardando ativação por e-mail)
        await tx.admin.create({
          data: {
            first_name: formattedFirstName,
            last_name: formattedLastName,
            display_name: formattedDisplayName,
            email: email,
            password: hashedPassword,
            email_verified: false,
            verification_token: verificationToken,
            organizations: {
              connect: { id: org.id },
            },
          },
        });
      })
    );

    // ENVIA E-MAIL DE CONFIRMAÇÃO
    await sendVerificationEmail(email, verificationToken);
  } catch (error: any) {
    console.error("[registerAdmin] Erro no registro:", error);

    // 1. Conflito de Chave Única (P2002)
    if (error?.code === "P2002") {
      const target = Array.isArray(error?.meta?.target)
        ? error.meta.target.join(", ")
        : String(error?.meta?.target || "");

      if (target.includes("email") || error?.message?.includes("email")) {
        return {
          error:
            "Este e-mail já está cadastrado no sistema. Faça login ou solicite recuperação de senha caso tenha esquecido.",
        };
      }
      if (target.includes("slug")) {
        return {
          error:
            "Já existe uma empresa com um nome idêntico ou muito semelhante. Experimente adicionar uma palavra diferenciadora no Nome Fantasia.",
        };
      }
      if (target.includes("document")) {
        return {
          error:
            "Este CPF ou CNPJ já está vinculado a uma conta existente no sistema.",
        };
      }
      return {
        error: `Dado duplicado (${target || "registro já existente"}). Por favor, verifique os dados informados.`,
      };
    }

    // 2. Erro de Validação de Dados Prisma
    if (error?.name === "PrismaClientValidationError") {
      return {
        error:
          "Houve uma inconsistência nos campos preenchidos. Por favor, revise todos os dados da empresa e do responsável.",
      };
    }

    // 3. Falha de Conexão ou Inicialização do Banco (Neon Cold-Start)
    if (
      error?.name === "PrismaClientInitializationError" ||
      error?.message?.includes("Can't reach database server") ||
      error?.code === "P1001"
    ) {
      return {
        error:
          "O banco de dados da nuvem estava iniciando a conexão (cold start) e demorou para responder. Por favor, clique novamente em 'Finalizar Cadastro'.",
      };
    }

    // 4. Falha de Envio de E-mail
    if (
      error?.message?.toLowerCase().includes("email") ||
      error?.message?.toLowerCase().includes("resend")
    ) {
      return {
        error:
          "A conta foi criada, mas ocorreu uma falha ao enviar o e-mail de ativação. Tente fazer login ou solicite o reenvio de confirmação.",
      };
    }

    // 5. Mensagem amigável com detalhe caso disponível
    const detailMessage =
      typeof error?.message === "string" && !error.message.includes("invocation")
        ? error.message
        : null;

    return {
      error: detailMessage
        ? `Não foi possível concluir o cadastro: ${detailMessage}`
        : "Ocorreu uma falha temporária ao registrar os dados no servidor. Por favor, tente novamente em alguns instantes.",
    };
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
        error: "Nenhuma conta encontrada com este e-mail. Verifique e tente novamente.",
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
