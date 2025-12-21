const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testScoring() {
  try {
    console.log('--- Testing Scoring Logic ---');
    
    // 1. Get or create a test user
    let user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'dummy'
        }
      });
    }

    // 2. Get a group match
    const match = await prisma.match.findFirst({
      where: { stage: 'group' }
    });
    
    if (!match) {
      console.error('No group match found in DB');
      return;
    }

    console.log(`Testing with match ${match.matchNumber} (${match.stage})`);

    // Clean up old predictions for this user/match
    await prisma.prediction.deleteMany({
      where: { userId: user.id, matchId: match.id }
    });

    // Case 1: Exact Score (3 points)
    console.log('Scenario 1: Exact Score');
    const p1 = await prisma.prediction.create({
      data: {
        userId: user.id,
        matchId: match.id,
        predictedHome: 2,
        predictedAway: 1
      }
    });
    
    // Simulate API update
    await updatePoints(match.id, 2, 1);
    
    const updatedP1 = await prisma.prediction.findUnique({ where: { id: p1.id } });
    console.log(`Predicted 2-1, Actual 2-1. Points: ${updatedP1.pointsEarned} (Expected: 3)`);

    // Case 2: Correct Result, Wrong Score (1 point)
    console.log('Scenario 2: Correct Result, Wrong Score');
    await prisma.prediction.update({
      where: { id: p1.id },
      data: { predictedHome: 1, predictedAway: 0, pointsEarned: 0 }
    });
    
    await updatePoints(match.id, 2, 1);
    const updatedP2 = await prisma.prediction.findUnique({ where: { id: p1.id } });
    console.log(`Predicted 1-0, Actual 2-1. Points: ${updatedP2.pointsEarned} (Expected: 1)`);

    // Case 3: Incorrect Result (0 points)
    console.log('Scenario 3: Incorrect Result');
    await prisma.prediction.update({
      where: { id: p1.id },
      data: { predictedHome: 0, predictedAway: 1, pointsEarned: 0 }
    });
    
    await updatePoints(match.id, 2, 1);
    const updatedP3 = await prisma.prediction.findUnique({ where: { id: p1.id } });
    console.log(`Predicted 0-1, Actual 2-1. Points: ${updatedP3.pointsEarned} (Expected: 0)`);

  } catch (error) {
    console.error('Error in testScoring:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function updatePoints(matchId, homeScore, awayScore) {
    // This is a simplified version of the logic in the API route
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
    });

    const actualResult =
      homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';

    for (const prediction of predictions) {
      let points = 0;
      if (prediction.predictedHome === homeScore && prediction.predictedAway === awayScore) {
        points = 3;
      } else {
        const predictedResult =
          prediction.predictedHome > prediction.predictedAway ? 'home' : 
          prediction.predictedHome < prediction.predictedAway ? 'away' : 'draw';
        if (predictedResult === actualResult) {
          points = 1;
        }
      }
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { pointsEarned: points },
      });
    }
}

testScoring();
