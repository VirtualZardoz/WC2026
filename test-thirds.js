const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Inline the tournament logic for testing if needed, or fix imports
// Let's try to just run it with ts-node correctly by using absolute paths or similar
// Actually, I will just use the compiled JS if I can find it in .next

async function testThirds() {
  console.log('Testing best third-placed teams logic...');

  // Set all group matches to 1-0 for home team, except some to make 3rd places interesting
  const groupMatches = await prisma.match.findMany({ where: { stage: 'group' } });
  
  for (const match of groupMatches) {
    // Group A: Team 1 (3-0-0, 9pts), Team 2 (2-0-1, 6pts), Team 3 (1-0-2, 3pts), Team 4 (0-0-3, 0pts)
    // We want to control the results to have specific standings
    const group = match.group;
    const homeTeam = await prisma.team.findUnique({ where: { id: match.homeTeamId } });
    const awayTeam = await prisma.team.findUnique({ where: { id: match.awayTeamId } });
    
    const homePos = parseInt(homeTeam.code.substring(1)) || 1; // A1 -> 1
    const awayPos = parseInt(awayTeam.code.substring(1)) || 2; // A2 -> 2
    
    // Simple logic: lower index wins
    if (homePos < awayPos) {
      await prisma.match.update({
        where: { id: match.id },
        data: { realScoreHome: 1, realScoreAway: 0 }
      });
    } else {
      await prisma.match.update({
        where: { id: match.id },
        data: { realScoreHome: 0, realScoreAway: 1 }
      });
    }
  }

  // To make 3rd places different, let's adjust some results
  // We need 12 groups, top 8 thirds qualify.
  // Group A third: 3 pts, GD 0
  // Group B third: 3 pts, GD -1
  // ... and so on.
  
  console.log('Updating knockout bracket...');
  await updateKnockoutBracket();
  
  const r32WithThirds = await prisma.match.findMany({
    where: { 
      stage: 'round32',
      awayPlaceholder: { startsWith: '3rd' }
    },
    include: { awayTeam: true }
  });
  
  console.log('Round of 32 matches with 3rd placed teams:');
  r32WithThirds.forEach(m => {
    console.log(`Match ${m.matchNumber} (${m.awayPlaceholder}): ${m.awayTeam?.name || 'NONE'}`);
  });
  
  const filledCount = r32WithThirds.filter(m => m.awayTeamId !== null).length;
  if (filledCount === 8) {
    console.log('✅ Success: All 8 slots for 3rd placed teams are filled.');
    process.exit(0);
  } else {
    console.log(`❌ Failure: Only ${filledCount}/8 slots filled.`);
    process.exit(1);
  }
}

testThirds().catch(err => {
  console.error(err);
  process.exit(1);
});
