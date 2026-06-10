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

    // Determine actual winner for knockout matches.
    // This sets the bracket cascade winner; uses body.winnerId for penalty draws.
    // Logic lives here (not in lib/scoring.ts) because it drives bracket progression.
    let actualWinnerId: string | null = null;
    if (match.stage !== 'group') {
      if (homeScore > awayScore) {
        actualWinnerId = match.homeTeamId;
      } else if (awayScore > homeScore) {
        actualWinnerId = match.awayTeamId;
      } else {
        // Draw in knockout — winner decided by penalties, must be provided
        if (!winnerId) {
          return NextResponse.json(
            { error: 'Winner selection is required for knockout draws' },
            { status: 400 }
          );
        }
        actualWinnerId = winnerId;
      }
    }

    // Fetch all predictions before the transaction so we can compute points
    // outside the tx (pure function — no DB reads needed inside tx).
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
    });

    // Build the scored updates array once (pure computation).
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
    // Transaction strategy: Option B — transact match.update + all per-prediction
    // pointsEarned writes together. The bracket cascade functions (updateKnockoutBracket /
    // advanceKnockoutWinner) use the module-level prisma client and are intentionally
    // kept outside the tx to avoid modifying verified bracket feeder logic.
    // The highest-value invariant (result + points commit atomically) is preserved.
    // -----------------------------------------------------------------------

    // Run bracket cascade BEFORE the transaction so the match state it reads is current.
    if (match.stage === 'group') {
      await updateKnockoutBracket();
    } else if (actualWinnerId) {
      await advanceKnockoutWinner(matchId, actualWinnerId);
    }

    // Atomic: match score update + all prediction point writes
    await prisma.$transaction(async (tx) => {
      // Update match result
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
