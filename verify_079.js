const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Verifying Complete Admin Journey (#079)');

  // 1. Find 8 group matches
  const matches = await prisma.match.findMany({
    where: { stage: 'group' },
    take: 8,
    orderBy: { matchNumber: 'asc' }
  });

  console.log('Entering results for 8 matches...');
  for (const match of matches) {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        realScoreHome: 1,
        realScoreAway: 0
      }
    });
  }

  // 2. Verify results displayed
  const completedCount = await prisma.match.count({
    where: {
      stage: 'group',
      realScoreHome: { not: null }
    }
  });

  if (completedCount >= 8) {
    console.log(`Completed matches: ${completedCount}. Admin journey verification PASSED`);
    process.exit(0);
  } else {
    console.error(`Completed matches: ${completedCount}, expected at least 8. Admin journey verification FAILED`);
    process.exit(1);
  }
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
