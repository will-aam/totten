"use server";

import { requireAuth } from "@/lib/auth";
import nodemailer from "nodemailer";

// Controle simples em memória contra spam (Map: orgId -> timestamp)
const RATE_LIMIT_MAP = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000; // 2 minutos
const MAX_TEXT_LENGTH = 1000;
const MAX_IMAGE_SIZE_MB = 2; // 2MB por imagem

export async function sendSuggestionAction(formData: FormData) {
  try {
    const admin = await requireAuth();

    // 1. Verificação de SPAM / Rate Limit
    const lastTime = RATE_LIMIT_MAP.get(admin.organizationId) || 0;
    const now = Date.now();
    if (now - lastTime < RATE_LIMIT_WINDOW_MS) {
      return { success: false, error: "Por favor, aguarde alguns minutos antes de enviar outra sugestão para evitar spam." };
    }

    // 2. Coletar texto
    const suggestionText = formData.get("suggestionText")?.toString() || "";

    if (!suggestionText || !suggestionText.trim()) {
      return { success: false, error: "A sugestão não pode estar vazia." };
    }

    if (suggestionText.length > MAX_TEXT_LENGTH) {
      return { success: false, error: `A sugestão é muito longa. O limite é de ${MAX_TEXT_LENGTH} caracteres.` };
    }

    // 3. Coletar Imagens
    const images = formData.getAll("images") as File[];
    if (images.length > 2) {
      return { success: false, error: "Você pode enviar no máximo 2 imagens." };
    }

    const attachments = [];
    for (const image of images) {
      if (image.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
         return { success: false, error: `A imagem ${image.name} excede o limite de ${MAX_IMAGE_SIZE_MB}MB.` };
      }
      if (!image.type.startsWith("image/")) {
         return { success: false, error: `O arquivo ${image.name} não é uma imagem válida.` };
      }
      const buffer = Buffer.from(await image.arrayBuffer());
      attachments.push({
        filename: image.name,
        content: buffer,
        contentType: image.type,
      });
    }

    // Registra envio para rate-limit
    RATE_LIMIT_MAP.set(admin.organizationId, now);

    const gmailUser = process.env.GMAIL_USER || "tottenappbr@gmail.com";
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    const transporter = nodemailer.createTransport(
      gmailPass
        ? {
            service: "gmail",
            auth: {
              user: gmailUser,
              pass: gmailPass.replace(/\s+/g, ""),
            },
          }
        : {
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "465"),
            secure: process.env.SMTP_SECURE === "true" || true,
            auth: {
              user: process.env.SMTP_USER || gmailUser,
              pass: process.env.SMTP_PASS || "",
            },
          }
    );

    const emailContent = `
      <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f9fafb; color: #1f2937;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px; font-weight: bold;">Nova Sugestão de Melhoria Recebida! 💡</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.8;">Totten - Plataforma</p>
          </div>
          <div style="padding: 24px;">
            <div style="margin-bottom: 20px; padding: 12px; background: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Enviado por:</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #111827;">${admin.name || "Usuário sem nome"} (${admin.email || "Sem e-mail"})</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #4b5563;">Empresa / Organização: <strong>${admin.organizationName || "Organização"}</strong></p>
            </div>

            <div style="margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Mensagem / Sugestão:</p>
              <div style="padding: 16px; background-color: #ffffff; border-left: 4px solid #0f172a; border: 1px solid #e5e7eb; border-left-width: 4px; border-radius: 4px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${suggestionText}</div>
            </div>
            
            ${attachments.length > 0 ? `<p style="font-size: 13px; color: #6b7280;"><em>* Este e-mail contém ${attachments.length} imagem(ns) anexada(s).</em></p>` : ""}

            <p style="font-size: 11px; color: #9ca3af; margin: 20px 0 0 0; text-align: center;">
              Recebido em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Totten Sugestões" <${gmailUser}>`,
      to: "tottenappbr@gmail.com",
      replyTo: admin.email || undefined,
      subject: `💡 Nova Sugestão de ${admin.name || admin.organizationName || "Usuário"}`,
      html: emailContent,
      attachments,
    };

    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error: any) {
    console.error("[ACTION sendSuggestionAction]", error);
    return {
      success: false,
      error: error?.message || "Erro ao enviar sugestão por e-mail.",
    };
  }
}
