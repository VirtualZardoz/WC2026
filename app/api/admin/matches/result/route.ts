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
    const body = await request.json();
    const { matchId, homeScore, awayScore } = body;

    // Validation
    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: 'Match ID and scores are required' },
        { status: 400 }
      );
    }

    if (homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20) {
      return NextResponse.json(
        { error: 'Scores must be between 0 and 20' },
        { status: 400 }
      );
    }

    // Check if match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Update match result
    await prisma.match.update({
      where: { id: matchId },
      data: {
        realScoreHome: homeScore,
        realScoreAway: awayScore,
      },
    });

    // Calculate points for all predictions on this match
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
    });

    // Determine actual result
    const actualResult =
      homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';

    for (const prediction of predictions) {
      let points = 0;

      // Check for exact score
      if (
        prediction.predictedHome === homeScore &&
        prediction.predictedAway === awayScore
      ) {
        points = 3;
      } else {
        // Check for correct result
        const predictedResult =
          prediction.predictedHome > prediction.predictedAway
            ? 'home'
            : prediction.predictedHome < prediction.predictedAway
            ? 'away'
            : 'draw';

        if (predictedResult === actualResult) {
          points = 1;
        }
      }

      // Update prediction points
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { pointsEarned: points },
      });
    }

    return NextResponse.json({
      message: 'Result saved and points calculated',
      predictionsUpdated: predictions.length,
    });
  } catch (error) {
    console.error('Error saving match result:', error);
    return NextResponse.json(
      { error: 'Failed to save match result' },
      { status: 500 }
    );
  }
}
