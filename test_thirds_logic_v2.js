const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { updateKnockoutBracket } = require('./lib/tournament');

async function testThirds() {
  try {
    console.log('--- Testing Best Third-Placed Teams Logic ---');

    // 1. Setup mock results for all 72 group matches
    // This is a lot, so let's just make sure all matches are "completed"
    const groupMatches = await prisma.match.findMany({ where: { stage: 'group' } });
    
    console.log(`Setting results for ${groupMatches.length} group matches...`);
    
    for (const match of groupMatches) {
        // Arbitrary results: home win 2-0
        await prisma.match.update({
            where: { id: match.id },
            data: { realScoreHome: 2, realScoreAway: 0 }
        });
    }

    // 2. Trigger knockout bracket update
    console.log('Updating knockout bracket...');
    await updateKnockoutBracket();

    // 3. Verify that Match 73 (first R32 match) has teams
    const r32Matches = await prisma.match.findMany({
        where: { stage: 'round32' }
    });

    const matchesWithTeams = r32Matches.filter(m => m.homeTeamId && m.awayTeamId);
    console.log(`${matchesWithTeams.length} / ${r32Matches.length} Round of 32 matches have both teams assigned.`);

    if (matchesWithTeams.length === 16) {
        console.log('SUCCESS: All Round of 32 matches populated!');
    } else {
        console.error('FAILURE: Not all R32 matches populated.');
    }

    // 4. Specifically check for "3rd" placeholders
    const matchesWithThirds = r32Matches.filter(m => m.awayPlaceholder?.startsWith('3rd '));
    console.log(`Checking ${matchesWithThirds.length} matches that should have 3rd placed teams...`);
    
    const thirdsPopulated = matchesWithThirds.every(m => m.awayTeamId);
    if (thirdsPopulated && matchesWithThirds.length > 0) {
        console.log('SUCCESS: All 3rd placed slots populated!');
    } else if (matchesWithThirds.length > 0) {
        console.error('FAILURE: Some 3rd placed slots are empty.');
    }

  } catch (error) {
    console.error('Error in testThirds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testThirds();
