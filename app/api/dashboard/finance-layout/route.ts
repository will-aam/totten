import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { dashboard_layout: true },
    });

    const fullLayout = (admin?.dashboard_layout as any) || null;
    // Se for objeto com finance_layout
    const financeLayout = fullLayout?.finance_layout || (Array.isArray(fullLayout) ? null : fullLayout?.finance || null);

    return NextResponse.json({ layout: financeLayout });
  } catch (error) {
    console.error("Error fetching finance dashboard layout:", error);
    return NextResponse.json({ error: "Erro ao buscar layout" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { layout } = await req.json();

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { dashboard_layout: true },
    });

    const currentLayout = admin?.dashboard_layout;
    let updatedLayout: any;

    if (Array.isArray(currentLayout)) {
      // Se era array direto (layout do dashboard principal), converte para container
      updatedLayout = {
        main_layout: currentLayout,
        finance_layout: layout,
      };
    } else if (currentLayout && typeof currentLayout === "object") {
      updatedLayout = {
        ...currentLayout,
        finance_layout: layout,
      };
    } else {
      updatedLayout = {
        finance_layout: layout,
      };
    }

    await prisma.admin.update({
      where: { id: session.user.id },
      data: { dashboard_layout: updatedLayout },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating finance dashboard layout:", error);
    return NextResponse.json({ error: "Erro ao salvar layout" }, { status: 500 });
  }
}
