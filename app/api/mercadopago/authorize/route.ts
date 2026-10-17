import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuth();
    if (!admin?.organizationId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const clientId = process.env.MERCADO_PAGO_CLIENT_ID;
    const redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "MERCADO_PAGO_CLIENT_ID ou MERCADO_PAGO_REDIRECT_URI não configurados." },
        { status: 500 }
      );
    }

    // O state carrega o ID da organização para vincular de forma segura no callback
    const state = Buffer.from(
      JSON.stringify({
        orgId: admin.organizationId,
        timestamp: Date.now(),
      })
    ).toString("base64url");

    // URL oficial de autorização do Mercado Pago
    const authUrl = new URL("https://auth.mercadopago.com/authorization");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("platform_id", "mp");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("redirect_uri", redirectUri);

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error("[MP_AUTHORIZE_ERROR]", error);
    return NextResponse.redirect(new URL("/admin/custom-page?tab=agendamento&mp_error=auth_failed", request.url));
  }
}
