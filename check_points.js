const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking points for users...');
  const users = await prisma.user.findMany({
    include: {
      predictions: {
        include: {
          match: true
        }
      }
    }
  });

  for (const user of users) {
    let totalPoints = 0;
    user.predictions.forEach(p => {
      if (p.pointsEarned > 0) {
        console.log(`User ${user.name} earned ${p.pointsEarned} points for match ${p.match.matchNumber}`);
        totalPoints += p.pointsEarned;
      }
    });
    console.log(`User ${user.name} total points: ${totalPoints}`);
  }
}

main().finally(() => prisma.$disconnect());
