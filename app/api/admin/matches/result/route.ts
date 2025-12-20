import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { advanceKnockoutWinner, updateKnockoutBracket } from '@/lib/tournament';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { matchId, homeScore, awayScore, winnerId } = body;

    // Validation
    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: 'Match ID and scores are required' },
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

    // Determine actual winner for knockout matches
    let actualWinnerId = null;
    if (match.stage !== 'group') {
      if (homeScore > awayScore) {
        actualWinnerId = match.homeTeamId;
      } else if (awayScore > homeScore) {
        actualWinnerId = match.awayTeamId;
      } else {
        // Draw in knockout, use provided winnerId (penalties)
        if (!winnerId) {
          return NextResponse.json(
            { error: 'Winner selection is required for knockout draws' },
            { status: 400 }
          );
        }
        actualWinnerId = winnerId;
      }
    }

    // Update match result
    await prisma.match.update({
      where: { id: matchId },
      data: {
        realScoreHome: homeScore,
        realScoreAway: awayScore,
      },
    });

    // Auto-progression
    if (match.stage === 'group') {
      await updateKnockoutBracket();
    } else if (actualWinnerId) {
      await advanceKnockoutWinner(matchId, actualWinnerId);
    }

    // Calculate points for all predictions on this match
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
    });

    const actualResult =
      homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';

    for (const prediction of predictions) {
      let points = 0;

      // 1. Check for exact score (3 points)
      if (
        prediction.predictedHome === homeScore &&
        prediction.predictedAway === awayScore
      ) {
        points = 3;
      } else {
        // 2. Check for correct result (1 point)
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

      // 3. Knockout bonus (1 point)
      if (match.stage !== 'group' && actualWinnerId) {
        // If user predicted the same winner as the actual winner
        // We need to determine user's predicted winner
        let userPredictedWinnerId = null;
        if (prediction.predictedHome > prediction.predictedAway) {
          userPredictedWinnerId = match.homeTeamId;
        } else if (prediction.predictedAway > prediction.predictedHome) {
          userPredictedWinnerId = match.awayTeamId;
        } else {
          // Prediction was a draw
          // For now we assume user's predictedWinner is "home" or "away" (slug)
          userPredictedWinnerId =
            prediction.predictedWinner === 'home'
              ? match.homeTeamId
              : prediction.predictedWinner === 'away'
              ? match.awayTeamId
              : null;
        }

        if (userPredictedWinnerId === actualWinnerId) {
          points += 1;
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
