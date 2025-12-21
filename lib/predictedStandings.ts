/**
 * Calculate predicted group standings based on user's predictions
 * This is used to show users who they predict will qualify for the knockout stage
 */

interface Team {
  id: string;
  name: string;
  code: string;
  group: string | null;
  flagEmoji: string | null;
}

interface Prediction {
  id: string;
  matchId: string;
  predictedHome: number;
  predictedAway: number;
  predictedWinner: string | null;
}

interface Match {
  id: string;
  matchNumber: number;
  stage: string;
  group: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  predictions: Prediction[];
}

interface TeamStanding {
  id: string;
  team: Team;
  pts: number;
  gp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
}

/**
 * Calculate predicted standings for a single group based on user predictions
 */
export function calculatePredictedGroupStandings(
  groupMatches: Match[]
): TeamStanding[] {
  const teams: { [key: string]: TeamStanding } = {};

  // Initialize teams from group matches
  groupMatches.forEach((match) => {
    if (match.homeTeamId && match.homeTeam && !teams[match.homeTeamId]) {
      teams[match.homeTeamId] = {
        id: match.homeTeamId,
        team: match.homeTeam,
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
    if (match.awayTeamId && match.awayTeam && !teams[match.awayTeamId]) {
      teams[match.awayTeamId] = {
        id: match.awayTeamId,
        team: match.awayTeam,
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

  // Calculate points from predictions
  groupMatches.forEach((match) => {
    const prediction = match.predictions[0];
    if (!prediction || !match.homeTeamId || !match.awayTeamId) return;

    const homeId = match.homeTeamId;
    const awayId = match.awayTeamId;
    const homeGoals = prediction.predictedHome;
    const awayGoals = prediction.predictedAway;

    if (!teams[homeId] || !teams[awayId]) return;

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
    return a.team.name.localeCompare(b.team.name);
  });

  return standings;
}

/**
 * Calculate all group standings and return predicted qualifiers
 */
export function calculateAllPredictedStandings(
  matchesByGroup: { [key: string]: Match[] }
): {
  standings: { [key: string]: TeamStanding[] };
  qualifiers: {
    winners: { [group: string]: Team | null };
    runnersUp: { [group: string]: Team | null };
    bestThirds: Team[];
  };
  isComplete: { [key: string]: boolean };
} {
  const standings: { [key: string]: TeamStanding[] } = {};
  const isComplete: { [key: string]: boolean } = {};
  const winners: { [group: string]: Team | null } = {};
  const runnersUp: { [group: string]: Team | null } = {};
  const thirds: TeamStanding[] = [];

  const groups = Object.keys(matchesByGroup).sort();

  for (const group of groups) {
    const groupMatches = matchesByGroup[group];
    // Check if all 6 matches have predictions
    const predictedCount = groupMatches.filter(m => m.predictions.length > 0).length;
    isComplete[group] = predictedCount === 6;

    if (isComplete[group]) {
      standings[group] = calculatePredictedGroupStandings(groupMatches);
      winners[group] = standings[group][0]?.team || null;
      runnersUp[group] = standings[group][1]?.team || null;
      if (standings[group][2]) {
        thirds.push(standings[group][2]);
      }
    } else {
      standings[group] = [];
      winners[group] = null;
      runnersUp[group] = null;
    }
  }

  // Sort third-place teams to find best 8
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return 0;
  });

  const bestThirds = thirds.slice(0, 8).map(s => s.team);

  return { standings, qualifiers: { winners, runnersUp, bestThirds }, isComplete };
}

/**
 * Determine predicted winner of a knockout match based on user's prediction
 */
export function getPredictedWinner(match: Match): Team | null {
  const prediction = match.predictions[0];
  if (!prediction) return null;

  const homeScore = prediction.predictedHome;
  const awayScore = prediction.predictedAway;

  if (homeScore > awayScore) {
    return match.homeTeam;
  } else if (awayScore > homeScore) {
    return match.awayTeam;
  } else {
    // Draw - check predictedWinner for penalties
    if (prediction.predictedWinner === 'home') {
      return match.homeTeam;
    } else if (prediction.predictedWinner === 'away') {
      return match.awayTeam;
    }
    return null;
  }
}

/**
 * Cascade predictions through knockout bracket
 * Returns a map of match positions to predicted teams
 */
export function cascadeKnockoutPredictions(
  knockoutMatches: Match[],
  qualifiers: {
    winners: { [group: string]: Team | null };
    runnersUp: { [group: string]: Team | null };
    bestThirds: Team[];
  }
): { [matchId: string]: { home: Team | null; away: Team | null; winner: Team | null } } {
  const result: { [matchId: string]: { home: Team | null; away: Team | null; winner: Team | null } } = {};

  // Organize matches by number for easy lookup
  const matchByNumber: { [num: number]: Match } = {};
  knockoutMatches.forEach(m => {
    matchByNumber[m.matchNumber] = m;
  });

  // Track predicted winners by match number
  const winnersMap: { [matchNum: number]: Team | null } = {};
  const losersMap: { [matchNum: number]: Team | null } = {};

  // Map stage codes to match number offsets
  const stageOffsets: { [key: string]: number } = {
    'R32': 72, // Match 73 = R32 M1, so offset is 72
    'R16': 88, // Match 89 = R16 M1, so offset is 88
    'QF': 96,  // Match 97 = QF M1, so offset is 96
    'SF': 100, // Match 101 = SF M1, so offset is 100
  };

  // Helper to resolve placeholder to team
  const resolveTeam = (placeholder: string | null, matchNum: number, isHome: boolean): Team | null => {
    if (!placeholder) return null;

    // Handle "Winner A", "Winner B" for group winners
    if (placeholder.startsWith('Winner ') && placeholder.split(' ')[1].length === 1) {
      const group = placeholder.split(' ')[1];
      return qualifiers.winners[group] || null;
    }
    if (placeholder.startsWith('Runner-up ')) {
      const group = placeholder.split(' ')[1];
      return qualifiers.runnersUp[group] || null;
    }
    if (placeholder.startsWith('3rd ')) {
      // Find which 3rd place slot this is
      const r32ThirdMatches = knockoutMatches
        .filter(m => m.stage === 'round32' && m.awayPlaceholder?.startsWith('3rd '))
        .sort((a, b) => a.matchNumber - b.matchNumber);

      const match = matchByNumber[matchNum];
      const idx = r32ThirdMatches.findIndex(m => m.id === match?.id);
      if (idx >= 0 && qualifiers.bestThirds[idx]) {
        return qualifiers.bestThirds[idx];
      }
      return null;
    }
    // Handle "Winner R32 M1", "Winner R16 M2", etc.
    const winnerMatch = placeholder.match(/^Winner (R32|R16|QF|SF) M(\d+)$/);
    if (winnerMatch) {
      const [, stage, matchNumStr] = winnerMatch;
      const resolvedMatchNum = stageOffsets[stage] + parseInt(matchNumStr);
      return winnersMap[resolvedMatchNum] || null;
    }
    // Handle "Loser SF M1", "Loser SF M2" for third place
    const loserMatch = placeholder.match(/^Loser (SF) M(\d+)$/);
    if (loserMatch) {
      const [, stage, matchNumStr] = loserMatch;
      const resolvedMatchNum = stageOffsets[stage] + parseInt(matchNumStr);
      return losersMap[resolvedMatchNum] || null;
    }
    // Legacy format: "Winner Match X"
    if (placeholder.startsWith('Winner Match ')) {
      const num = parseInt(placeholder.split(' ')[2]);
      return winnersMap[num] || null;
    }
    if (placeholder.startsWith('Loser Match ')) {
      const num = parseInt(placeholder.split(' ')[2]);
      return losersMap[num] || null;
    }
    return null;
  };

  // Process matches in order (R32 -> R16 -> QF -> SF -> 3rd/Final)
  const sortedMatches = [...knockoutMatches].sort((a, b) => a.matchNumber - b.matchNumber);

  for (const match of sortedMatches) {
    // Determine home and away teams
    let homeTeam = match.homeTeam;
    let awayTeam = match.awayTeam;

    // Try to resolve from placeholders if not set
    if (!homeTeam && match.homePlaceholder) {
      homeTeam = resolveTeam(match.homePlaceholder, match.matchNumber, true);
    }
    if (!awayTeam && match.awayPlaceholder) {
      awayTeam = resolveTeam(match.awayPlaceholder, match.matchNumber, false);
    }

    // Determine winner from prediction
    let winner: Team | null = null;
    const prediction = match.predictions[0];
    if (prediction && homeTeam && awayTeam) {
      const homeScore = prediction.predictedHome;
      const awayScore = prediction.predictedAway;

      if (homeScore > awayScore) {
        winner = homeTeam;
      } else if (awayScore > homeScore) {
        winner = awayTeam;
      } else {
        // Draw - check predictedWinner
        if (prediction.predictedWinner === 'home') {
          winner = homeTeam;
        } else if (prediction.predictedWinner === 'away') {
          winner = awayTeam;
        }
      }
    }

    // Store winner and loser for cascade
    winnersMap[match.matchNumber] = winner;
    if (winner && homeTeam && awayTeam) {
      losersMap[match.matchNumber] = winner.id === homeTeam.id ? awayTeam : homeTeam;
    }

    result[match.id] = { home: homeTeam, away: awayTeam, winner };
  }

  return result;
}
