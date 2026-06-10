import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { advanceKnockoutWinner, updateKnockoutBracket } from '@/lib/tournament';
import { calculatePredictionPoints } from '@/lib/scoring';

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

      // Determine actual winner for knockout matches.
      // Logic lives here (not in lib/scoring.ts) because it drives bracket progression.
      let actualWinnerId: string | null = null;
      if (match.stage !== 'group') {
        if (homeScore > awayScore) {
          actualWinnerId = match.homeTeamId;
        } else if (awayScore > homeScore) {
          actualWinnerId = match.awayTeamId;
        } else {
          actualWinnerId = winnerId ?? null;
        }
      }

      // Fetch predictions and compute points before entering the transaction
      const predictions = await prisma.prediction.findMany({
        where: { matchId },
      });

      const scoredUpdates = predictions.map((prediction) => ({
        id: prediction.id,
        pointsEarned: calculatePredictionPoints(
          {
            predictedHome: prediction.predictedHome,
            predictedAway: prediction.predictedAway,
            predictedWinner: prediction.predictedWinner,
          },
          {
            stage: match.stage,
            realScoreHome: homeScore,
            realScoreAway: awayScore,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            actualWinnerId,
          }
        ),
      }));

      // -----------------------------------------------------------------------
      // Transaction strategy: Option B (per-match) — transact match.update + all
      // per-prediction pointsEarned writes for THIS match in one atomic operation.
      // Cascade functions (updateKnockoutBracket / advanceKnockoutWinner) use the
      // module-level prisma client and run outside the tx. One bad match does not
      // corrupt others — existing continue-on-invalid behavior is preserved.
      // -----------------------------------------------------------------------

      // Run bracket cascade before the transaction for this match
      if (match.stage === 'group') {
        await updateKnockoutBracket();
      } else if (actualWinnerId) {
        await advanceKnockoutWinner(matchId, actualWinnerId);
      }

      // Atomic per-match: score update + all prediction point writes
      await prisma.$transaction(async (tx) => {
        await tx.match.update({
          where: { id: matchId },
          data: {
            realScoreHome: homeScore,
            realScoreAway: awayScore,
          },
        });

        // Write all prediction points (SET, never increment — idempotent)
        for (const { id, pointsEarned } of scoredUpdates) {
          await tx.prediction.update({
            where: { id },
            data: { pointsEarned },
          });
        }
      });

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
