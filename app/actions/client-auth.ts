"use server";

import { prisma as db } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "totten-super-secret-key-123";

// Conexão do SMTP (use os dados do seu provedor de email)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.resend.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE === "true", // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER || "resend",
    pass: process.env.SMTP_PASS || "re_...", // Substituir no .env
  },
});

export async function sendClientOtp(email: string, orgSlug: string) {
  try {
    const org = await db.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) return { success: false, message: "Organização não encontrada" };

    const client = await db.client.findFirst({
      where: { email, organization_id: org.id },
    });

    if (!client) {
      return { success: false, message: "E-mail não cadastrado em nosso sistema." };
    }

    // Gerar código OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Salvar código
    await db.client.update({
      where: { id: client.id },
      data: {
        auth_code: code,
        auth_code_expires_at: expiresAt,
      },
    });

    // Disparar e-mail
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Sistema de Agendamento" <no-reply@seu-dominio.com>',
      to: email,
      subject: `Seu código de acesso: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Olá, ${client.name}!</h2>
          <p>Você solicitou acesso à sua área do cliente na <strong>${org.name}</strong>.</p>
          <p>Seu código de verificação é:</p>
          <div style="font-size: 32px; font-weight: bold; margin: 20px 0; padding: 10px; background: #f4f4f5; display: inline-block; border-radius: 8px;">
            ${code}
          </div>
          <p>Este código é válido por 10 minutos.</p>
          <p>Se você não solicitou este acesso, pode ignorar este e-mail.</p>
        </div>
      `,
    };

    // No ambiente local sem SMTP configurado, o envio vai falhar.
    // Você pode logar no console para facilitar o teste:
    console.log(`[OTP EMAIL GERADO]: ${code} para ${email}`);

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error("Erro ao enviar email, verifique o SMTP:", err);
      // Para fins de teste/desenvolvimento, se falhar o SMTP, não vamos travar o fluxo caso vc queira pegar o código no console.
      // return { success: false, message: "Erro ao enviar o e-mail de segurança." };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro em sendClientOtp:", error);
    return { success: false, message: "Ocorreu um erro ao gerar o código." };
  }
}

export async function verifyClientOtp(email: string, code: string, orgSlug: string) {
  try {
    const org = await db.organization.findUnique({ where: { slug: orgSlug } });
    if (!org) return { success: false, message: "Organização não encontrada" };

    const client = await db.client.findFirst({
      where: { email, organization_id: org.id },
    });

    if (!client) {
      return { success: false, message: "Cliente não encontrado." };
    }

    if (!client.auth_code || client.auth_code !== code) {
      return { success: false, message: "Código inválido." };
    }

    if (!client.auth_code_expires_at || client.auth_code_expires_at < new Date()) {
      return { success: false, message: "Código expirado. Solicite outro." };
    }

    // Sucesso! Gerar JWT e setar cookie seguro
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT({ clientId: client.id, orgId: org.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    (await cookies()).set(`totten_client_session_${org.slug}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: "/",
    });

    // Limpar o código usado
    await db.client.update({
      where: { id: client.id },
      data: {
        auth_code: null,
        auth_code_expires_at: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro em verifyClientOtp:", error);
    return { success: false, message: "Erro interno ao validar o código." };
  }
}

export async function getClientSession(orgSlug: string) {
  const token = (await cookies()).get(`totten_client_session_${orgSlug}`)?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.clientId as string;
  } catch (error) {
    return null;
  }
}

export async function logoutClientSession(orgSlug: string) {
  (await cookies()).delete(`totten_client_session_${orgSlug}`);
  return { success: true };
}
