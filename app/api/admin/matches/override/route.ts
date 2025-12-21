import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { overrideKnockoutTeam } from '@/lib/tournament';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { matchId, teamId, slot } = body;

    if (!matchId || !teamId || !slot) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (slot !== 'home' && slot !== 'away') {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    }

    await overrideKnockoutTeam(matchId, teamId, slot);

    return NextResponse.json({ message: 'Match team overridden successfully' });
  } catch (error) {
    console.error('Error overriding match team:', error);
    return NextResponse.json({ error: 'Failed to override match team' }, { status: 500 });
  }
}
