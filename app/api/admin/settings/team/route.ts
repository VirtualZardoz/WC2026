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
    const { teamId, name } = await request.json();

    if (!teamId || !name) {
      return NextResponse.json({ error: 'Team ID and name are required' }, { status: 400 });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { name },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team name:', error);
    return NextResponse.json({ error: 'Failed to update team name' }, { status: 500 });
  }
}
