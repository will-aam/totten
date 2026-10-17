import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Destino base para redirecionamento após a autorização
  const returnBaseUrl = new URL("/admin/custom-page", request.url);

  if (error || !code) {
    console.error("[MP_CALLBACK_ERROR]", error, errorDescription);
    returnBaseUrl.searchParams.set("mp_status", "error");
    returnBaseUrl.searchParams.set("mp_msg", errorDescription || "Autorização cancelada");
    return NextResponse.redirect(returnBaseUrl);
  }

  try {
    let orgId: string | null = null;
    if (stateRaw) {
      const decoded = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf-8"));
      orgId = decoded.orgId;
    }

    if (!orgId) {
      returnBaseUrl.searchParams.set("mp_status", "error");
      returnBaseUrl.searchParams.set("mp_msg", "Estado da sessão inválido");
      return NextResponse.redirect(returnBaseUrl);
    }

    const clientId = process.env.MERCADO_PAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET;
    const redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI;

    // Troca o authorization code pelo Access Token oficial via API do Mercado Pago
    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[MP_TOKEN_EXCHANGE_ERROR]", tokenData);
      returnBaseUrl.searchParams.set("mp_status", "error");
      returnBaseUrl.searchParams.set("mp_msg", tokenData.message || "Falha ao obter token");
      return NextResponse.redirect(returnBaseUrl);
    }

    // Persiste os dados de acesso da conta do usuário no modelo Settings
    await prisma.settings.update({
      where: { organization_id: orgId },
      data: {
        pix_payment_type: "MERCADO_PAGO",
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token || null,
        mp_public_key: tokenData.public_key || null,
        mp_user_id: String(tokenData.user_id || ""),
      },
    });

    returnBaseUrl.searchParams.set("mp_status", "success");
    return NextResponse.redirect(returnBaseUrl);
  } catch (err: any) {
    console.error("[MP_CALLBACK_EXCEPTION]", err);
    returnBaseUrl.searchParams.set("mp_status", "error");
    returnBaseUrl.searchParams.set("mp_msg", "Erro interno ao processar autorização");
    return NextResponse.redirect(returnBaseUrl);
  }
}
