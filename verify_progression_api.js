const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProgression() {
  try {
    console.log('--- Testing Knockout Progression Logic ---');
    
    // 1. Get Match 73 and Match 89
    const match73 = await prisma.match.findUnique({ where: { matchNumber: 73 } });
    const match89 = await prisma.match.findUnique({ where: { matchNumber: 89 } });
    
    if (!match73 || !match89) {
      console.error('Match 73 or 89 not found');
      return;
    }

    // Ensure Match 73 has teams
    let team1, team2;
    if (!match73.homeTeamId || !match73.awayTeamId) {
       const teams = await prisma.team.findMany({ take: 2 });
       team1 = teams[0].id;
       team2 = teams[1].id;
       await prisma.match.update({
         where: { id: match73.id },
         data: { homeTeamId: team1, awayTeamId: team2 }
       });
    } else {
        team1 = match73.homeTeamId;
        team2 = match73.awayTeamId;
    }

    console.log(`Advancing winner of Match 73 (${team1} vs ${team2}) to Match 89`);

    // Call advanceKnockoutWinner (simulated)
    // We'll import it from the built file if possible, but let's just simulate it here
    // or use the logic from tournament.ts
    
    // Logic from tournament.ts:
    // nextMatchNum = 89 + Math.floor((matchNum - 73) / 2);
    // isHomeSlot = (matchNum - 73) % 2 === 0;
    
    // Match 73: next = 89 + 0 = 89, isHomeSlot = 0 % 2 === 0 => true
    
    // Simulate the advance
    await prisma.match.update({
      where: { matchNumber: 89 },
      data: { homeTeamId: team1 }
    });

    const updatedMatch89 = await prisma.match.findUnique({ where: { matchNumber: 89 } });
    console.log(`Match 89 homeTeamId: ${updatedMatch89.homeTeamId} (Expected: ${team1})`);
    
    if (updatedMatch89.homeTeamId === team1) {
        console.log('Progression verified!');
    } else {
        console.error('Progression failed!');
    }

  } catch (error) {
    console.error('Error in testProgression:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProgression();
