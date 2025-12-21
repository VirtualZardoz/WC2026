const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Testing Bulk Entry Logic (#055)');
  
  // 1. Create a test user
  const email = `test_bulk_${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Bulk Test User',
      passwordHash: 'dummy',
    }
  });
  console.log('Created test user:', user.email);

  // 2. Find two group matches
  const matches = await prisma.match.findMany({
    where: { stage: 'group' },
    take: 2,
    orderBy: { matchNumber: 'asc' }
  });

  if (matches.length < 2) {
    console.error('Not enough matches found');
    process.exit(1);
  }

  // 3. Create predictions for these matches
  await prisma.prediction.createMany({
    data: [
      { userId: user.id, matchId: matches[0].id, predictedHome: 2, predictedAway: 1 },
      { userId: user.id, matchId: matches[1].id, predictedHome: 1, predictedAway: 1 },
    ]
  });
  console.log('Created predictions');

  // 4. Simulate the bulk logic from the API route
  // We'll just use a mock object and iterate
  const results = [
    { matchId: matches[0].id, homeScore: 2, awayScore: 1 }, // Exact match -> 3 pts
    { matchId: matches[1].id, homeScore: 0, awayScore: 0 }, // Correct result (draw) -> 1 pt
  ];

  console.log('Simulating bulk update logic...');
  for (const res of results) {
    const { matchId, homeScore, awayScore } = res;
    
    await prisma.match.update({
      where: { id: matchId },
      data: {
        realScoreHome: homeScore,
        realScoreAway: awayScore,
      },
    });

    const predictions = await prisma.prediction.findMany({
      where: { matchId },
    });

    const actualResult = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';

    for (const prediction of predictions) {
      let points = 0;
      if (prediction.predictedHome === homeScore && prediction.predictedAway === awayScore) {
        points = 3;
      } else {
        const predictedResult = prediction.predictedHome > prediction.predictedAway ? 'home' : 
                                prediction.predictedHome < prediction.predictedAway ? 'away' : 'draw';
        if (predictedResult === actualResult) {
          points = 1;
        }
      }
      
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { pointsEarned: points }
      });
    }
  }

  // 5. Verify points
  const updatedPredictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    include: { match: true }
  });

  let allPassed = true;
  for (const p of updatedPredictions) {
    if (p.matchId === matches[0].id) {
      if (p.pointsEarned === 3) {
        console.log(`Match ${p.match.matchNumber}: 3 points (Correct)`);
      } else {
        console.error(`Match ${p.match.matchNumber}: expected 3 points, got ${p.pointsEarned}`);
        allPassed = false;
      }
    } else if (p.matchId === matches[1].id) {
      if (p.pointsEarned === 1) {
        console.log(`Match ${p.match.matchNumber}: 1 point (Correct)`);
      } else {
        console.error(`Match ${p.match.matchNumber}: expected 1 point, got ${p.pointsEarned}`);
        allPassed = false;
      }
    }
  }

  if (allPassed) {
    console.log('Bulk logic verification PASSED');
    process.exit(0);
  } else {
    console.log('Bulk logic verification FAILED');
    process.exit(1);
  }
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
