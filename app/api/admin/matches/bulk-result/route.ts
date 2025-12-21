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
    const { results } = body; // Array of { matchId, homeScore, awayScore, winnerId }

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'Results array is required' },
        { status: 400 }
      );
    }

    const updatedPredictionsCount = [];

    for (const res of results) {
      const { matchId, homeScore, awayScore, winnerId } = res;

      if (!matchId || homeScore === undefined || awayScore === undefined) {
        continue;
      }

      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) continue;

      let actualWinnerId = null;
      if (match.stage !== 'group') {
        if (homeScore > awayScore) {
          actualWinnerId = match.homeTeamId;
        } else if (awayScore > homeScore) {
          actualWinnerId = match.awayTeamId;
        } else {
          actualWinnerId = winnerId;
        }
      }

      await prisma.match.update({
        where: { id: matchId },
        data: {
          realScoreHome: homeScore,
          realScoreAway: awayScore,
        },
      });

      if (match.stage === 'group') {
        await updateKnockoutBracket();
      } else if (actualWinnerId) {
        await advanceKnockoutWinner(matchId, actualWinnerId);
      }

      const predictions = await prisma.prediction.findMany({
        where: { matchId },
      });

      const actualResult =
        homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';

      for (const prediction of predictions) {
        let points = 0;
        if (
          prediction.predictedHome === homeScore &&
          prediction.predictedAway === awayScore
        ) {
          points = 3;
        } else {
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

        if (match.stage !== 'group' && actualWinnerId) {
          let userPredictedWinnerId = null;
          if (prediction.predictedHome > prediction.predictedAway) {
            userPredictedWinnerId = match.homeTeamId;
          } else if (prediction.predictedAway > prediction.predictedHome) {
            userPredictedWinnerId = match.awayTeamId;
          } else {
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

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { pointsEarned: points },
        });
      }
      updatedPredictionsCount.push(predictions.length);
    }

    return NextResponse.json({
      message: 'Bulk results saved and points calculated',
      totalMatchesUpdated: results.length,
    });
  } catch (error) {
    console.error('Error saving bulk results:', error);
    return NextResponse.json(
      { error: 'Failed to save bulk results' },
      { status: 500 }
    );
  }
}
