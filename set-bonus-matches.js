const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Setting bonus matches...');
  // Mark matches 1, 10, 50, 72, 104 as bonus matches
  const matchNums = [1, 10, 50, 72, 104];
  await prisma.match.updateMany({
    where: { matchNumber: { in: matchNums } },
    data: { isBonusMatch: true }
  });
  console.log('✅ Done');
}

run().catch(console.error).finally(() => prisma.$disconnect());
