const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // 1. Find or create a user
  let user = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'dummy',
      }
    });
  }

  // 2. Find a match
  const match = await prisma.match.findFirst({ where: { stage: 'group' } });
  
  // 3. Create a prediction
  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId: match.id } },
    update: { predictedHome: 2, predictedAway: 1, pointsEarned: 0 },
    create: {
      userId: user.id,
      matchId: match.id,
      predictedHome: 2,
      predictedAway: 1,
      pointsEarned: 0
    }
  });

  console.log('Prediction created/updated for user:', user.name);

  // 4. Check leaderboard before
  const leaderboardBefore = await fetchLeaderboard();
  const userEntryBefore = leaderboardBefore.find(e => e.userId === user.id);
  console.log('Points before:', userEntryBefore ? userEntryBefore.totalPoints : 0);

  // 5. Update match result (Exact score)
  console.log('Updating match result to 2-1...');
  await prisma.match.update({
    where: { id: match.id },
    data: { realScoreHome: 2, realScoreAway: 1 }
  });

  // Calculate points for all predictions for this match (this is what the API does)
  const predictions = await prisma.prediction.findMany({ where: { matchId: match.id } });
  for (const pred of predictions) {
    let points = 0;
    if (pred.predictedHome === 2 && pred.predictedAway === 1) {
      points = 3;
    } else if ((pred.predictedHome > pred.predictedAway && 2 > 1) ||
               (pred.predictedHome < pred.predictedAway && 2 < 1)) {
      points = 1;
    }
    await prisma.prediction.update({
      where: { id: pred.id },
      data: { pointsEarned: points }
    });
  }

  // 6. Check leaderboard after
  const leaderboardAfter = await fetchLeaderboard();
  const userEntryAfter = leaderboardAfter.find(e => e.userId === user.id);
  console.log('Points after:', userEntryAfter ? userEntryAfter.totalPoints : 0);

  if (userEntryAfter && userEntryAfter.totalPoints > (userEntryBefore ? userEntryBefore.totalPoints : 0)) {
    console.log('✅ Success: Leaderboard updated!');
  } else {
    console.log('❌ Failure: Leaderboard did not update.');
  }
}

async function fetchLeaderboard() {
  const users = await prisma.user.findMany({
    include: {
      predictions: true
    }
  });
  
  return users.map(user => {
    const totalPoints = user.predictions.reduce((sum, p) => sum + p.pointsEarned, 0);
    return { userId: user.id, totalPoints };
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
