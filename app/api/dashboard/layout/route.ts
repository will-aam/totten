export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_WIDGET_IDS = [
  "appointments_volume",
  "heatmap",
  "scheduling",
  "busiest_hours",
  "ticket",
  "ranking",
  "checkins",
] as const;

const WidgetItemSchema = z.object({
  id: z.enum(ALLOWED_WIDGET_IDS),
  name: z.string().min(1).max(100),
  visible: z.boolean(),
});

const LayoutPayloadSchema = z.object({
  layout: z.array(WidgetItemSchema).max(20),
});

export async function GET() {
  try {
    const admin = await requireAuth();

    const adminRecord = await prisma.admin.findUnique({
      where: { id: admin.id },
      select: { dashboard_layout: true },
    });

    const currentLayout = adminRecord?.dashboard_layout;
    if (Array.isArray(currentLayout)) {
      return NextResponse.json({ layout: currentLayout });
    }
    if (currentLayout && typeof currentLayout === "object") {
      return NextResponse.json({
        layout: (currentLayout as any).main_layout || null,
      });
    }

    return NextResponse.json({ layout: null });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching dashboard layout:", error);
    return NextResponse.json({ error: "Erro ao buscar layout" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await requireAuth();

    const body = await req.json();
    const parseResult = LayoutPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Payload de layout inválido", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { layout } = parseResult.data;

    const adminRecord = await prisma.admin.findUnique({
      where: { id: admin.id },
      select: { dashboard_layout: true },
    });

    const currentLayout = adminRecord?.dashboard_layout;
    let updatedLayout: any;

    if (
      currentLayout &&
      typeof currentLayout === "object" &&
      !Array.isArray(currentLayout)
    ) {
      updatedLayout = {
        ...currentLayout,
        main_layout: layout,
      };
    } else {
      updatedLayout = {
        main_layout: layout,
      };
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { dashboard_layout: updatedLayout },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error updating dashboard layout:", error);
    return NextResponse.json({ error: "Erro ao salvar layout" }, { status: 500 });
  }
}
