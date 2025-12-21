import { PrismaClient } from '@prisma/client';
import { updateKnockoutBracket, advanceKnockoutWinner } from './lib/tournament';

const prisma = new PrismaClient();

async function run() {
  console.log('Starting Tournament Simulation Test...');
  
  try {
    // 1. Verify group stage completion triggers Round of 32
    // We'll just test one group as a sample, assuming the logic holds for all
    const group = 'A';
    const teams = await prisma.team.findMany({ where: { group } });
    if (teams.length < 2) throw new Error('Not enough teams in Group A');

    console.log(`Testing Group ${group} standings and progression...`);
    
    // Set some results for group A
    const matches = await prisma.match.findMany({ where: { group, stage: 'group' } });
    for (const match of matches) {
      await prisma.match.update({
        where: { id: match.id },
        data: { realScoreHome: 2, realScoreAway: 0 } // Home wins all
      });
    }

    await updateKnockoutBracket();
    
    const r32Matches = await prisma.match.findMany({
      where: { stage: 'round32' }
    });
    
    const winnerAMatch = r32Matches.find(m => m.homePlaceholder === 'Winner A' || m.awayPlaceholder === 'Winner A');
    const runnerAMatch = r32Matches.find(m => m.homePlaceholder === 'Runner-up A' || m.awayPlaceholder === 'Runner-up A');

    if (winnerAMatch && (winnerAMatch.homeTeamId || winnerAMatch.awayTeamId)) {
      console.log('✅ Round of 32 populated from Group A results');
    } else {
      throw new Error('❌ Round of 32 NOT populated from Group A');
    }

    // 2. Verify knockout winner advancement
    console.log('Testing knockout advancement...');
    const knockoutMatch = await prisma.match.findFirst({ where: { stage: 'round32' } });
    if (!knockoutMatch || !knockoutMatch.homeTeamId) throw new Error('No populated knockout match found');

    const winnerId = knockoutMatch.homeTeamId;
    await advanceKnockoutWinner(knockoutMatch.id, winnerId);

    // Find the next match
    // Round of 32 (73-88) -> Round of 16 (89-96)
    const nextMatchNum = 89 + Math.floor((knockoutMatch.matchNumber - 73) / 2);
    const nextMatch = await prisma.match.findUnique({ where: { matchNumber: nextMatchNum } });

    if (nextMatch && (nextMatch.homeTeamId === winnerId || nextMatch.awayTeamId === winnerId)) {
      console.log(`✅ Winner of match ${knockoutMatch.matchNumber} advanced to match ${nextMatchNum}`);
    } else {
      throw new Error(`❌ Knockout advancement failed for match ${knockoutMatch.matchNumber}`);
    }

    console.log('TOURNAMENT SIMULATION LOGIC VERIFIED');

  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
