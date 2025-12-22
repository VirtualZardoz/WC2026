const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fill all matches with random realistic results
 * This simulates the tournament being played for testing purposes
 */

async function fillRandomResults() {
  console.log('🎲 Filling matches with random results...\n');

  // Get all matches ordered by match number
  const matches = await prisma.match.findMany({
    orderBy: { matchNumber: 'asc' },
    include: { homeTeam: true, awayTeam: true }
  });

  console.log(`Found ${matches.length} matches\n`);

  // Track winners for knockout progression
  const knockoutWinners = {}; // matchNumber -> winnerId
  const knockoutLosers = {}; // matchNumber -> loserId

  // Group stage standings for determining qualifiers
  const groupStandings = {};

  for (const match of matches) {
    // Generate random but realistic scores (0-5 range, weighted toward lower scores)
    const homeScore = weightedRandomScore();
    const awayScore = weightedRandomScore();

    await prisma.match.update({
      where: { id: match.id },
      data: {
        realScoreHome: homeScore,
        realScoreAway: awayScore,
      }
    });

    // Track group stage results
    if (match.stage === 'group' && match.homeTeamId && match.awayTeamId) {
      const group = match.group;
      if (!groupStandings[group]) {
        groupStandings[group] = {};
      }

      if (!groupStandings[group][match.homeTeamId]) {
        groupStandings[group][match.homeTeamId] = { pts: 0, gd: 0, gf: 0, teamId: match.homeTeamId };
      }
      if (!groupStandings[group][match.awayTeamId]) {
        groupStandings[group][match.awayTeamId] = { pts: 0, gd: 0, gf: 0, teamId: match.awayTeamId };
      }

      groupStandings[group][match.homeTeamId].gf += homeScore;
      groupStandings[group][match.homeTeamId].gd += (homeScore - awayScore);
      groupStandings[group][match.awayTeamId].gf += awayScore;
      groupStandings[group][match.awayTeamId].gd += (awayScore - homeScore);

      if (homeScore > awayScore) {
        groupStandings[group][match.homeTeamId].pts += 3;
      } else if (awayScore > homeScore) {
        groupStandings[group][match.awayTeamId].pts += 3;
      } else {
        groupStandings[group][match.homeTeamId].pts += 1;
        groupStandings[group][match.awayTeamId].pts += 1;
      }
    }

    // Determine winner for knockout matches
    if (match.stage !== 'group') {
      let winnerId, loserId;

      if (homeScore > awayScore) {
        winnerId = match.homeTeamId;
        loserId = match.awayTeamId;
      } else if (awayScore > homeScore) {
        winnerId = match.awayTeamId;
        loserId = match.homeTeamId;
      } else {
        // Draw in knockout - random penalty shootout winner
        if (Math.random() > 0.5) {
          winnerId = match.homeTeamId;
          loserId = match.awayTeamId;
        } else {
          winnerId = match.awayTeamId;
          loserId = match.homeTeamId;
        }
      }

      knockoutWinners[match.matchNumber] = winnerId;
      knockoutLosers[match.matchNumber] = loserId;
    }

    const homeTeamName = match.homeTeam?.code || match.homePlaceholder || '?';
    const awayTeamName = match.awayTeam?.code || match.awayPlaceholder || '?';
    console.log(`  Match ${match.matchNumber}: ${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName}`);
  }

  // Now assign actual teams to knockout matches based on results
  console.log('\n🏆 Assigning knockout teams based on group results...\n');

  // Calculate final group standings and qualifiers
  const groupQualifiers = {};
  const thirdPlaceTeams = [];

  for (const group of Object.keys(groupStandings).sort()) {
    const standings = Object.values(groupStandings[group])
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });

    groupQualifiers[group] = {
      winner: standings[0]?.teamId,
      runnerUp: standings[1]?.teamId,
      third: standings[2]?.teamId,
    };

    if (standings[2]) {
      thirdPlaceTeams.push({
        ...standings[2],
        group,
      });
    }

    console.log(`  Group ${group}: 1st=${standings[0]?.teamId?.slice(-4)}, 2nd=${standings[1]?.teamId?.slice(-4)}, 3rd=${standings[2]?.teamId?.slice(-4)}`);
  }

  // Sort third place teams and take best 8
  thirdPlaceTeams.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
  const best8Thirds = thirdPlaceTeams.slice(0, 8);
  console.log(`\n  Best 8 third-place teams: ${best8Thirds.map(t => t.group).join(', ')}`);

  // Assign teams to R32 matches
  const r32Matches = await prisma.match.findMany({
    where: { stage: 'round32' },
    orderBy: { matchNumber: 'asc' },
  });

  let thirdIdx = 0;
  for (const match of r32Matches) {
    let homeTeamId = null;
    let awayTeamId = null;

    // Resolve home placeholder
    if (match.homePlaceholder?.startsWith('Winner ')) {
      const group = match.homePlaceholder.split(' ')[1];
      if (group.length === 1) {
        homeTeamId = groupQualifiers[group]?.winner;
      }
    }

    // Resolve away placeholder
    if (match.awayPlaceholder?.startsWith('Runner-up ')) {
      const group = match.awayPlaceholder.split(' ')[1];
      awayTeamId = groupQualifiers[group]?.runnerUp;
    } else if (match.awayPlaceholder?.startsWith('3rd ')) {
      if (thirdIdx < best8Thirds.length) {
        awayTeamId = best8Thirds[thirdIdx].teamId;
        thirdIdx++;
      }
    }

    if (homeTeamId || awayTeamId) {
      await prisma.match.update({
        where: { id: match.id },
        data: { homeTeamId, awayTeamId }
      });
    }
  }

  console.log('\n✅ Random results filled for all matches!');
  console.log('\nRefresh the admin page to see the results.');

  await prisma.$disconnect();
}

// Generate weighted random scores (lower scores more likely)
function weightedRandomScore() {
  const weights = [25, 30, 25, 12, 5, 3]; // 0, 1, 2, 3, 4, 5
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  return 0;
}

fillRandomResults().catch(console.error);
