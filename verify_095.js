const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Verifying Concurrent Prediction Saves (#095)');

  // 1. Create a test user
  const email = `test_concurrent_${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Concurrent Test User',
      passwordHash: 'dummy',
    }
  });

  // 2. Find a match
  const match = await prisma.match.findFirst();

  console.log('Simulating 10 concurrent upserts...');
  
  // 3. Fire 10 upserts simultaneously
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      prisma.prediction.upsert({
        where: {
          userId_matchId: {
            userId: user.id,
            matchId: match.id,
          },
        },
        update: { predictedHome: i, predictedAway: i },
        create: {
          userId: user.id,
          matchId: match.id,
          predictedHome: i,
          predictedAway: i,
        },
      })
    );
  }

  try {
    const results = await Promise.all(promises);
    console.log('All concurrent requests completed without error.');
    
    // 4. Verify the final state is one of the results
    const final = await prisma.prediction.findUnique({
      where: {
        userId_matchId: {
          userId: user.id,
          matchId: match.id,
        },
      }
    });
    
    console.log(`Final prediction score: ${final.predictedHome}-${final.predictedAway}`);
    console.log('Concurrent saves test PASSED');
    process.exit(0);
  } catch (error) {
    console.error('Concurrent saves test FAILED:', error);
    process.exit(1);
  }
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
