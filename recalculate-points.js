const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Recalculate points for all predictions based on match results
 * Scoring:
 * - Exact score: 3 points
 * - Correct result (win/draw/loss): 1 point
 * - Knockout correct winner bonus: 1 point
 */

async function recalculatePoints() {
  console.log('🔄 Recalculating all prediction points...\n');

  // Get all matches with results
  const matches = await prisma.match.findMany({
    where: {
      realScoreHome: { not: null },
      realScoreAway: { not: null },
    },
    orderBy: { matchNumber: 'asc' },
  });

  console.log(`Found ${matches.length} matches with results\n`);

  let totalPredictions = 0;
  let totalPoints = 0;
  let exactScores = 0;
  let correctResults = 0;

  for (const match of matches) {
    const homeScore = match.realScoreHome;
    const awayScore = match.realScoreAway;

    // Determine actual result
    const actualResult = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';

    // Determine actual winner for knockout (if draw, we need to figure it out)
    let actualWinnerId = null;
    if (match.stage !== 'group') {
      if (homeScore > awayScore) {
        actualWinnerId = match.homeTeamId;
      } else if (awayScore > homeScore) {
        actualWinnerId = match.awayTeamId;
      } else {
        // Draw in knockout - randomly pick winner for simulation purposes
        actualWinnerId = Math.random() > 0.5 ? match.homeTeamId : match.awayTeamId;
      }
    }

    // Get all predictions for this match
    const predictions = await prisma.prediction.findMany({
      where: { matchId: match.id },
    });

    for (const prediction of predictions) {
      let points = 0;

      // 1. Check for exact score (3 points)
      if (prediction.predictedHome === homeScore && prediction.predictedAway === awayScore) {
        points = 3;
        exactScores++;
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
          correctResults++;
        }
      }

      // 3. Knockout bonus (1 point for correct winner)
      if (match.stage !== 'group' && actualWinnerId) {
        let userPredictedWinnerId = null;
        if (prediction.predictedHome > prediction.predictedAway) {
          userPredictedWinnerId = match.homeTeamId;
        } else if (prediction.predictedAway > prediction.predictedHome) {
          userPredictedWinnerId = match.awayTeamId;
        } else {
          // User predicted draw - check their winner selection
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

      totalPredictions++;
      totalPoints += points;
    }

    if (predictions.length > 0) {
      console.log(`  Match ${match.matchNumber}: ${predictions.length} predictions updated`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  Total predictions: ${totalPredictions}`);
  console.log(`  Exact scores: ${exactScores}`);
  console.log(`  Correct results: ${correctResults}`);
  console.log(`  Total points awarded: ${totalPoints}`);

  // Show leaderboard
  console.log('\n🏆 Leaderboard:');
  const users = await prisma.user.findMany({
    include: {
      predictions: {
        select: { pointsEarned: true }
      }
    }
  });

  const leaderboard = users
    .map(user => ({
      name: user.name,
      points: user.predictions.reduce((sum, p) => sum + p.pointsEarned, 0),
      predictions: user.predictions.length,
    }))
    .sort((a, b) => b.points - a.points);

  leaderboard.forEach((user, idx) => {
    console.log(`  ${idx + 1}. ${user.name}: ${user.points} points (${user.predictions} predictions)`);
  });

  console.log('\n✅ Points recalculated! Refresh the leaderboard page.');

  await prisma.$disconnect();
}

recalculatePoints().catch(console.error);
