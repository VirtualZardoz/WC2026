import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchId, isBonusMatch } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { isBonusMatch },
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Error updating bonus match status:', error);
    return NextResponse.json({ error: 'Failed to update bonus match status' }, { status: 500 });
  }
}
