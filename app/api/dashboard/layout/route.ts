import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { dashboard_layout: true }
    });

    const currentLayout = admin?.dashboard_layout;
    if (Array.isArray(currentLayout)) {
      return NextResponse.json({ layout: currentLayout });
    }
    if (currentLayout && typeof currentLayout === 'object') {
      return NextResponse.json({ layout: (currentLayout as any).main_layout || null });
    }

    return NextResponse.json({ layout: null });
  } catch (error) {
    console.error('Error fetching dashboard layout:', error);
    return NextResponse.json({ error: 'Erro ao buscar layout' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { layout } = await req.json();

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
      select: { dashboard_layout: true }
    });

    const currentLayout = admin?.dashboard_layout;
    let updatedLayout: any;

    if (currentLayout && typeof currentLayout === 'object' && !Array.isArray(currentLayout)) {
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
      where: { id: session.user.id },
      data: { dashboard_layout: updatedLayout }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating dashboard layout:', error);
    return NextResponse.json({ error: 'Erro ao salvar layout' }, { status: 500 });
  }
}
