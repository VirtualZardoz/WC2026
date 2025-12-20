import prisma from './prisma';

/**
 * Calculates standings for a group based on match results
 */
export async function calculateGroupStandings(group: string) {
  const matches = await prisma.match.findMany({
    where: { group, stage: 'group' },
    include: { homeTeam: true, awayTeam: true },
  });

  const teams: { [key: string]: any } = {};

  // Initialize teams in group
  matches.forEach((match) => {
    if (match.homeTeamId && !teams[match.homeTeamId]) {
      teams[match.homeTeamId] = {
        id: match.homeTeamId,
        name: match.homeTeam?.name,
        pts: 0,
        gp: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
      };
    }
    if (match.awayTeamId && !teams[match.awayTeamId]) {
      teams[match.awayTeamId] = {
        id: match.awayTeamId,
        name: match.awayTeam?.name,
        pts: 0,
        gp: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
      };
    }
  });

  // Calculate points and goals
  matches.forEach((match) => {
    if (match.realScoreHome === null || match.realScoreAway === null) return;

    const homeId = match.homeTeamId!;
    const awayId = match.awayTeamId!;
    const homeGoals = match.realScoreHome;
    const awayGoals = match.realScoreAway;

    teams[homeId].gp++;
    teams[awayId].gp++;
    teams[homeId].gf += homeGoals;
    teams[homeId].ga += awayGoals;
    teams[awayId].gf += awayGoals;
    teams[awayId].ga += homeGoals;

    if (homeGoals > awayGoals) {
      teams[homeId].pts += 3;
      teams[homeId].w++;
      teams[awayId].l++;
    } else if (homeGoals < awayGoals) {
      teams[awayId].pts += 3;
      teams[awayId].w++;
      teams[homeId].l++;
    } else {
      teams[homeId].pts += 1;
      teams[awayId].pts += 1;
      teams[homeId].d++;
      teams[awayId].d++;
    }
  });

  // Finalize GD and sort
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

/**
 * Updates knockout bracket based on group results
 */
export async function updateKnockoutBracket() {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const groupStandings: { [key: string]: any[] } = {};

  for (const group of groups) {
    groupStandings[group] = await calculateGroupStandings(group);
  }

  // Check if all group matches are completed
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
      if (groupStandings[g] && groupStandings[g].length > 0) {
        homeTeamId = groupStandings[g][0].id;
      }
    } else if (match.homePlaceholder?.startsWith('Runner-up ')) {
      const g = match.homePlaceholder.split(' ')[1];
      if (groupStandings[g] && groupStandings[g].length > 1) {
        homeTeamId = groupStandings[g][1].id;
      }
    }

    if (match.awayPlaceholder?.startsWith('Winner ')) {
      const g = match.awayPlaceholder.split(' ')[1];
      if (groupStandings[g] && groupStandings[g].length > 0) {
        awayTeamId = groupStandings[g][0].id;
      }
    } else if (match.awayPlaceholder?.startsWith('Runner-up ')) {
      const g = match.awayPlaceholder.split(' ')[1];
      if (groupStandings[g] && groupStandings[g].length > 1) {
        awayTeamId = groupStandings[g][1].id;
      }
    }

    // Best 3rd placed teams logic
    if (completedGroupMatches === totalGroupMatches) {
      const thirds = groups.map(g => groupStandings[g][2]).filter(Boolean);
      thirds.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return 0;
      });
      const bestThirds = thirds.slice(0, 8);

      if (match.homePlaceholder?.startsWith('3rd ')) {
         // Placeholder might be "3rd C/D/E" or similar
         // Since we don't have the full matrix, we just assign in order for now
         const matchIdx = knockoutMatches.indexOf(match);
         // This is a placeholder logic
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

/**
 * Advances winner of a knockout match to the next round
 */
export async function advanceKnockoutWinner(matchId: string, winnerId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;

  const matchNum = match.matchNumber;
  let nextMatchNum: number | null = null;
  let isHomeSlot = true;

  if (matchNum >= 73 && matchNum <= 88) {
    nextMatchNum = 89 + Math.floor((matchNum - 73) / 2);
    isHomeSlot = (matchNum - 73) % 2 === 0;
  } else if (matchNum >= 89 && matchNum <= 96) {
    nextMatchNum = 97 + Math.floor((matchNum - 89) / 2);
    isHomeSlot = (matchNum - 89) % 2 === 0;
  } else if (matchNum >= 97 && matchNum <= 100) {
    nextMatchNum = 101 + Math.floor((matchNum - 97) / 2);
    isHomeSlot = (matchNum - 97) % 2 === 0;
  } else if (matchNum >= 101 && matchNum <= 102) {
    nextMatchNum = 104;
    isHomeSlot = (matchNum - 101) % 2 === 0;
    
    const loserId = winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    if (loserId) {
      await prisma.match.update({
        where: { matchNumber: 103 },
        data: (matchNum - 101) % 2 === 0 ? { homeTeamId: loserId } : { awayTeamId: loserId },
      });
    }
  }

  if (nextMatchNum) {
    await prisma.match.update({
      where: { matchNumber: nextMatchNum },
      data: isHomeSlot ? { homeTeamId: winnerId } : { awayTeamId: winnerId },
    });
  }
}
