const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calculateGroupStandings(group) {
  const matches = await prisma.match.findMany({
    where: { group, stage: 'group' },
    include: { homeTeam: true, awayTeam: true },
  });

  const teams = {};

  matches.forEach((match) => {
    if (match.homeTeamId && !teams[match.homeTeamId]) {
      teams[match.homeTeamId] = {
        id: match.homeTeamId,
        name: match.homeTeam.name,
        pts: 0, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0,
      };
    }
    if (match.awayTeamId && !teams[match.awayTeamId]) {
      teams[match.awayTeamId] = {
        id: match.awayTeamId,
        name: match.awayTeam.name,
        pts: 0, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0,
      };
    }
  });

  matches.forEach((match) => {
    if (match.realScoreHome === null || match.realScoreAway === null) return;
    const homeId = match.homeTeamId;
    const awayId = match.awayTeamId;
    const homeGoals = match.realScoreHome;
    const awayGoals = match.realScoreAway;
    teams[homeId].gp++;
    teams[awayId].gp++;
    teams[homeId].gf += homeGoals;
    teams[homeId].ga += awayGoals;
    teams[awayId].gf += awayGoals;
    teams[awayId].ga += homeGoals;
    if (homeGoals > awayGoals) {
      teams[homeId].pts += 3; teams[homeId].w++; teams[awayId].l++;
    } else if (homeGoals < awayGoals) {
      teams[awayId].pts += 3; teams[awayId].w++; teams[homeId].l++;
    } else {
      teams[homeId].pts += 1; teams[awayId].pts += 1; teams[homeId].d++; teams[awayId].d++;
    }
  });

  const standings = Object.values(teams).map((team) => ({
    ...team,
    gd: team.gf - team.ga,
  }));

  standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  return standings;
}

async function updateKnockoutBracket() {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const groupStandings = {};
  for (const group of groups) {
    groupStandings[group] = await calculateGroupStandings(group);
  }

  const totalGroupMatches = await prisma.match.count({ where: { stage: 'group' } });
  const completedGroupMatches = await prisma.match.count({
    where: { stage: 'group', realScoreHome: { not: null } },
  });

  const knockoutMatches = await prisma.match.findMany({
    where: { stage: 'round32' },
  });

  for (const match of knockoutMatches) {
    let homeTeamId = match.homeTeamId;
    let awayTeamId = match.awayTeamId;

    if (match.homePlaceholder?.startsWith('Winner ')) {
      const g = match.homePlaceholder.split(' ')[1];
      if (groupStandings[g] && groupStandings[g].length > 0) homeTeamId = groupStandings[g][0].id;
    } else if (match.homePlaceholder?.startsWith('Runner-up ')) {
      const g = match.homePlaceholder.split(' ')[1];
      if (groupStandings[g] && groupStandings[g].length > 1) homeTeamId = groupStandings[g][1].id;
    }

    if (match.awayPlaceholder?.startsWith('Winner ')) {
      const g = match.awayPlaceholder.split(' ')[1];
      if (groupStandings[g] && groupStandings[g].length > 0) awayTeamId = groupStandings[g][0].id;
    } else if (match.awayPlaceholder?.startsWith('Runner-up ')) {
      const g = match.awayPlaceholder.split(' ')[1];
      if (groupStandings[g] && groupStandings[g].length > 1) awayTeamId = groupStandings[g][1].id;
    }

    if (completedGroupMatches === totalGroupMatches) {
      const thirds = groups.map(g => groupStandings[g][2]).filter(Boolean);
      thirds.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return 0;
      });
      const bestThirds = thirds.slice(0, 8);

      if (match.awayPlaceholder?.startsWith('3rd ')) {
        const r32MatchesWithThirds = knockoutMatches
          .filter(m => m.awayPlaceholder?.startsWith('3rd '))
          .sort((a, b) => a.matchNumber - b.matchNumber);
        const thirdIdx = r32MatchesWithThirds.findIndex(m => m.id === match.id);
        if (thirdIdx !== -1 && bestThirds[thirdIdx]) awayTeamId = bestThirds[thirdIdx].id;
      }
    }

    if (homeTeamId !== match.homeTeamId || awayTeamId !== match.awayTeamId) {
      await prisma.match.update({
        where: { id: match.id },
        data: { homeTeamId, awayTeamId },
      });
    }
  }
}

async function runTest() {
  console.log('Resetting results...');
  await prisma.match.updateMany({
    where: { stage: 'group' },
    data: { realScoreHome: null, realScoreAway: null }
  });

  const groupMatches = await prisma.match.findMany({ where: { stage: 'group' } });
  
  for (const match of groupMatches) {
    const teams = await prisma.team.findMany({
      where: { id: { in: [match.homeTeamId, match.awayTeamId] } }
    });
    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);
    
    // Extract number from code like 'A1' or use default
    const getPos = (code) => {
      const match = code.match(/\d+/);
      return match ? parseInt(match[0]) : 1;
    };
    
    const homePos = getPos(homeTeam.code);
    const awayPos = getPos(awayTeam.code);
    
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

  // Groups A-H: 3rd place will have 3 points (1 win, 2 losses)
  // Groups I-L: 3rd place will have 0 points (adjust results to make them worse)
  const groupIToLPred = (m) => ['I', 'J', 'K', 'L'].includes(m.group);
  const matchesToAdjust = await prisma.match.findMany({
    where: { group: { in: ['I', 'J', 'K', 'L'] } }
  });

  for (const match of matchesToAdjust) {
    // Make Team 3 lose all matches
    const teams = await prisma.team.findMany({
      where: { id: { in: [match.homeTeamId, match.awayTeamId] } }
    });
    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);

    if (homeTeam.code.endsWith('3')) {
      await prisma.match.update({
        where: { id: match.id },
        data: { realScoreHome: 0, realScoreAway: 5 }
      });
    } else if (awayTeam.code.endsWith('3')) {
      await prisma.match.update({
        where: { id: match.id },
        data: { realScoreHome: 5, realScoreAway: 0 }
      });
    }
  }

  console.log('Updating knockout bracket...');
  await updateKnockoutBracket();
  
  const r32WithThirds = await prisma.match.findMany({
    where: { stage: 'round32', awayPlaceholder: { startsWith: '3rd' } },
    include: { awayTeam: true }
  });
  
  console.log('Round of 32 matches with 3rd placed teams:');
  r32WithThirds.forEach(m => {
    console.log(`Match ${m.matchNumber} (${m.awayPlaceholder}): ${m.awayTeam?.name || 'NONE'}`);
  });
  
  const filledCount = r32WithThirds.filter(m => m.awayTeamId !== null).length;
  console.log(`Filled ${filledCount}/8 slots.`);
  
  if (filledCount === 8) {
    console.log('✅ Success!');
    process.exit(0);
  } else {
    console.log('❌ Failure!');
    process.exit(1);
  }
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
