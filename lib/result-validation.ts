export type MatchTeams = { homeTeamId: string | null; awayTeamId: string | null; stage: string };
export type ResultValidationError = { code: 'SCORES' | 'PLACEHOLDER' | 'WINNER' | 'KNOCKOUT_DRAW'; message: string };

/**
 * Validate a single result-entry payload against the match it targets.
 * Returns null when valid, or the first ResultValidationError otherwise.
 * Pure: no DB, no side effects.
 */
export function validateResultInput(
  input: { homeScore: unknown; awayScore: unknown; winnerId: unknown },
  match: MatchTeams
): ResultValidationError | null {
  const { homeScore, awayScore, winnerId } = input;
  // (a) integers 0-99, explicitly reject null
  const validScore = (s: unknown): s is number =>
    Number.isInteger(s) && (s as number) >= 0 && (s as number) <= 99;
  if (!validScore(homeScore) || !validScore(awayScore)) {
    return { code: 'SCORES', message: 'Scores must be integers between 0 and 99' };
  }
  // (d) reject unresolved-placeholder matches
  if (match.homeTeamId === null || match.awayTeamId === null) {
    return { code: 'PLACEHOLDER', message: 'Cannot enter a result for a match with unresolved teams' };
  }
  // (b) if winnerId provided, must be one of the two teams
  if (winnerId !== null && winnerId !== undefined &&
      winnerId !== match.homeTeamId && winnerId !== match.awayTeamId) {
    return { code: 'WINNER', message: 'Winner must be one of the two teams in the match' };
  }
  // (c) knockout draw needs a winnerId
  if (match.stage !== 'group' && (homeScore as number) === (awayScore as number) &&
      (winnerId === null || winnerId === undefined)) {
    return { code: 'KNOCKOUT_DRAW', message: 'Winner selection is required for knockout draws' };
  }
  return null;
}
