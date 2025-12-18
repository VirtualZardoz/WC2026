import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const predictions = await prisma.prediction.findMany({
      where: { userId: session.user.id },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });

    return NextResponse.json(predictions);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { matchId, predictedHome, predictedAway, predictedWinner } = body;

    // Validation
    if (!matchId || predictedHome === undefined || predictedAway === undefined) {
      return NextResponse.json(
        { error: 'Match ID and scores are required' },
        { status: 400 }
      );
    }

    if (
      predictedHome < 0 ||
      predictedHome > 20 ||
      predictedAway < 0 ||
      predictedAway > 20
    ) {
      return NextResponse.json(
        { error: 'Scores must be between 0 and 20' },
        { status: 400 }
      );
    }

    // Check if predictions are locked
    const tournament = await prisma.tournament.findFirst({
      where: { isActive: true },
    });

    if (tournament && new Date() > new Date(tournament.predictionDeadline)) {
      return NextResponse.json(
        { error: 'Predictions are locked. Deadline has passed.' },
        { status: 403 }
      );
    }

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Upsert prediction
    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: session.user.id,
          matchId,
        },
      },
      update: {
        predictedHome,
        predictedAway,
        predictedWinner,
      },
      create: {
        userId: session.user.id,
        matchId,
        predictedHome,
        predictedAway,
        predictedWinner,
      },
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Error saving prediction:', error);
    return NextResponse.json(
      { error: 'Failed to save prediction' },
      { status: 500 }
    );
  }
}
