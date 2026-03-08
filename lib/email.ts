import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: "Totten <noreply@totten.com.br>",
      to: email,
      subject: "✅ Confirme seu e-mail - Totten",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #18181b;">Bem-vindo ao Totten! 🎉</h1>
          <p>Olá! Para ativar sua conta, clique no botão abaixo:</p>
          
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background: #18181b; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Confirmar E-mail
          </a>
          
          <p style="color: #71717a; font-size: 14px;">
            Ou copie e cole este link no navegador:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          
          <hr style="border: 1px solid #e4e4e7; margin: 30px 0;">
          <p style="color: #a1a1aa; font-size: 12px;">
            Se você não criou uma conta no Totten, ignore este e-mail.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  tempPassword: string,
) {
  try {
    await resend.emails.send({
      from: "Totten <noreply@totten.com.br>",
      to: email,
      subject: "🔑 Nova senha temporária - Totten",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #18181b;">Recuperação de Senha</h1>
          <p>Você solicitou uma nova senha. Use a senha temporária abaixo para fazer login:</p>
          
          <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0;">
            ${tempPassword}
          </div>
          
          <p style="color: #ef4444; font-weight: 500;">
            ⚠️ Recomendamos que você altere esta senha nas configurações assim que fizer login.
          </p>
          
          <a href="${process.env.NEXTAUTH_URL}/admin/login" 
             style="display: inline-block; padding: 12px 24px; background: #18181b; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Fazer Login
          </a>
          
          <hr style="border: 1px solid #e4e4e7; margin: 30px 0;">
          <p style="color: #a1a1aa; font-size: 12px;">
            Se você não solicitou uma nova senha, ignore este e-mail.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return { success: false, error };
  }
}

export function generateRandomPassword() {
  return crypto.randomBytes(8).toString("base64").slice(0, 10);
}
