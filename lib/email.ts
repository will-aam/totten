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
export async function sendClosingReportEmail(
  email: string,
  monthStr: string,
  yearStr: string,
  data: {
    receitas: number;
    despesas: number;
    saldo: number;
    agendamentos: number;
  },
) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const colorSaldo = data.saldo >= 0 ? "#10b981" : "#ef4444"; // Verde se positivo, Vermelho se negativo

  try {
    await resend.emails.send({
      from: "Totten <noreply@totten.com.br>", // Dica: use o e-mail verificado no Resend
      to: email,
      subject: `📊 Fechamento Mensal - ${monthStr}/${yearStr}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
          <h1 style="color: #18181b; text-align: center;">Fechamento Mensal</h1>
          <p style="text-align: center; color: #71717a; font-size: 16px;">Resumo financeiro de ${monthStr} de ${yearStr}</p>
          
          <div style="background: #f4f4f5; padding: 24px; border-radius: 12px; margin: 24px 0;">
            <table style="width: 100%; font-size: 16px; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #71717a; border-bottom: 1px solid #e4e4e7;">Total de Receitas:</td>
                <td style="padding: 12px 0; text-align: right; color: #10b981; font-weight: bold; border-bottom: 1px solid #e4e4e7;">
                  ${formatCurrency(data.receitas)}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #71717a; border-bottom: 1px solid #e4e4e7;">Total de Despesas:</td>
                <td style="padding: 12px 0; text-align: right; color: #ef4444; font-weight: bold; border-bottom: 1px solid #e4e4e7;">
                  - ${formatCurrency(data.despesas)}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #71717a;">Atendimentos (Agenda):</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">
                  ${data.agendamentos}
                </td>
              </tr>
            </table>
            
            <div style="background: white; border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="color: #71717a; font-size: 14px; margin: 0 0 4px 0;">Saldo do Mês</p>
              <h2 style="color: ${colorSaldo}; margin: 0; font-size: 28px;">${formatCurrency(data.saldo)}</h2>
            </div>
          </div>
          
          <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 30px;">
            Este é um e-mail automático gerado pelo seu sistema Totten.<br>
            Você pode acessar o painel completo para ver os detalhes de cada transação.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar relatório por e-mail:", error);
    return { success: false, error };
  }
}
