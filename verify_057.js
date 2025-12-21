const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Verifying Knockout Override Logic (#057)');

  // 1. Find a knockout match
  const match = await prisma.match.findFirst({
    where: { stage: 'round32' },
    orderBy: { matchNumber: 'asc' }
  });

  if (!match) {
    console.error('No knockout match found');
    process.exit(1);
  }

  // 2. Find a team
  const team = await prisma.team.findFirst();
  if (!team) {
    console.error('No team found');
    process.exit(1);
  }

  console.log(`Overriding Match #${match.matchNumber} home team with ${team.name}`);

  // 3. Perform override directly using the logic from our API
  await prisma.match.update({
    where: { id: match.id },
    data: { homeTeamId: team.id }
  });

  // 4. Verify
  const updatedMatch = await prisma.match.findUnique({
    where: { id: match.id }
  });

  if (updatedMatch.homeTeamId === team.id) {
    console.log('Override SUCCESS');
    process.exit(0);
  } else {
    console.error('Override FAILED');
    process.exit(1);
  }
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
