const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testKnockout() {
  console.log('Testing knockout progression...');
  
  // 1. Get a group
  const groupAMatches = await prisma.match.findMany({
    where: { group: 'A', stage: 'group' },
    orderBy: { matchNumber: 'asc' }
  });

  const teams = await prisma.team.findMany({
    where: { group: 'A' }
  });

  console.log(`Teams in Group A: ${teams.map(t => t.name).join(', ')}`);

  // 2. Set results for Group A
  // We want to see if Winner A and Runner-up A appear in Round of 32
  // Team 0 wins all
  // Team 1 wins others
  
  for (let i = 0; i < groupAMatches.length; i++) {
    const m = groupAMatches[i];
    let hs = 0, as = 0;
    if (m.homeTeamId === teams[0].id) hs = 3;
    else if (m.awayTeamId === teams[0].id) as = 3;
    else if (m.homeTeamId === teams[1].id) hs = 3;
    else if (m.awayTeamId === teams[1].id) as = 3;
    
    // We'll use the API logic but directly via Prisma for this test
    await prisma.match.update({
      where: { id: m.id },
      data: { realScoreHome: hs, realScoreAway: as }
    });
  }

  // Import and run the logic
  const { updateKnockoutBracket, advanceKnockoutWinner } = require('./lib/tournament');
  await updateKnockoutBracket();

  const r32Match = await prisma.match.findFirst({
    where: { stage: 'round32', homePlaceholder: 'Winner Group A' }
  });

  if (r32Match && r32Match.homeTeamId === teams[0].id) {
    console.log('✅ Group winner auto-populated Round of 32');
  } else {
    console.log('❌ Group winner auto-population failed');
  }

  const r32Match2 = await prisma.match.findFirst({
    where: { stage: 'round32', awayPlaceholder: 'Runner-up Group A' }
  });

  if (r32Match2 && r32Match2.awayTeamId === teams[1].id) {
    console.log('✅ Group runner-up auto-populated Round of 32');
  } else {
    console.log('❌ Group runner-up auto-population failed');
  }

  // 3. Test advancing knockout winner
  const match73 = await prisma.match.findUnique({ where: { matchNumber: 73 } });
  // Set some teams for 73 if not set
  if (!match73.homeTeamId) {
    await prisma.match.update({
      where: { id: match73.id },
      data: { homeTeamId: teams[0].id, awayTeamId: teams[1].id }
    });
  }
  
  await advanceKnockoutWinner(match73.id, teams[0].id);
  
  const match89 = await prisma.match.findUnique({ where: { matchNumber: 89 } });
  if (match89.homeTeamId === teams[0].id) {
    console.log('✅ Knockout winner advanced to next round');
  } else {
    console.log('❌ Knockout advancement failed');
  }

  await prisma.$disconnect();
}

testKnockout().catch(console.error);
