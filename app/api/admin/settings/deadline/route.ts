import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deadline } = await request.json();

    if (!deadline) {
      return NextResponse.json({ error: 'Deadline is required' }, { status: 400 });
    }

    const tournament = await prisma.tournament.findFirst({
      where: { isActive: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'No active tournament found' }, { status: 404 });
    }

    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { predictionDeadline: new Date(deadline) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating deadline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
