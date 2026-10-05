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

    return NextResponse.json({ layout: admin?.dashboard_layout || null });
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

    await prisma.admin.update({
      where: { id: session.user.id },
      data: { dashboard_layout: layout }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating dashboard layout:', error);
    return NextResponse.json({ error: 'Erro ao salvar layout' }, { status: 500 });
  }
}
