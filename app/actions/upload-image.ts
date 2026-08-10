"use server";

import { requireAuth } from "@/lib/auth";
import { r2Client } from "@/lib/cloudflare-r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function uploadImageAction(base64Image: string, folder: string = "uploads") {
  try {
    const admin = await requireAuth();

    if (!base64Image.startsWith("data:image")) {
      return { success: false, error: "Formato de imagem inválido." };
    }

    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: "Formato de imagem inválido." };
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    const extension = mimeType.split("/")[1] || "png";
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${folder}/${admin.organizationId}-${timestamp}-${randomString}.${extension}`;
    
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL; // ex: https://pub-xyz.r2.dev

    if (!bucketName || !publicUrl) {
      throw new Error("R2_BUCKET_NAME ou R2_PUBLIC_URL não configurados.");
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    });

    await r2Client.send(command);

    const finalUrl = `${publicUrl.replace(/\/$/, '')}/${fileName}`;

    return { success: true, url: finalUrl };
  } catch (error: any) {
    console.error("[ACTION uploadImageAction]", error);
    return { success: false, error: error.message || "Falha ao fazer upload da imagem." };
  }
}
