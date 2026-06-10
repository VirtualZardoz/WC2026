/**
 * Pure prediction scoring engine — single source of truth.
 *
 * Scoring rules:
 *   Group stage (stage === 'group'):
 *     - Exact score (home & away both match)  => 3 points
 *     - Correct result (home/away/draw sign)  => 1 point
 *     - Miss                                  => 0 points
 *
 *   Knockout stages (stage !== 'group'):
 *     - Same base as group (3 / 1 / 0)
 *     - +1 bonus if the user's predicted winner matches the actual winner
 *       Perfect knockout pick => 4 points
 *
 *   isBonusMatch has NO effect on points — BY DESIGN.
 *   The isBonusMatch flag marks matches for off-platform prizes only
 *   (admin toggle visible in UI). It is intentionally not a parameter of
 *   this function and must never be branched on here.
 *   (Resolves CONCERNS.md "Bonus Match Scoring Ambiguity" as by-design.)
 *
 * This module has NO Prisma import and NO side effects. It is safe to
 * import in tests without any DB setup.
 */

export type PredictionInput = {
  predictedHome: number;
  predictedAway: number;
  predictedWinner: string | null; // 'home' | 'away' | null
};

export type ScoringContext = {
  stage: string;              // 'group' => no winner bonus
  realScoreHome: number;
  realScoreAway: number;
  homeTeamId: string | null;  // for mapping 'home'/'away' slot -> team id
  awayTeamId: string | null;
  actualWinnerId: string | null; // null for group; set for knockout (inc. penalties)
};

/**
 * Calculate how many points a single prediction earns against a real result.
 *
 * Pure function: same inputs always produce the same output; no DB access.
 */
export function calculatePredictionPoints(
  prediction: PredictionInput,
  ctx: ScoringContext
): number {
  const { predictedHome, predictedAway, predictedWinner } = prediction;
  const { stage, realScoreHome, realScoreAway, homeTeamId, awayTeamId, actualWinnerId } = ctx;

  // ------------------------------------------------------------------
  // Base score (group and knockout share this logic)
  // ------------------------------------------------------------------
  let points = 0;

  if (predictedHome === realScoreHome && predictedAway === realScoreAway) {
    // Exact score
    points = 3;
  } else {
    // Correct result direction?
    // Sign convention: positive = home, negative = away, zero = draw
    const predictedDiff = predictedHome - predictedAway;
    const realDiff = realScoreHome - realScoreAway;

    const sameResult =
      (predictedDiff > 0 && realDiff > 0) || // both home-win
      (predictedDiff < 0 && realDiff < 0) || // both away-win
      (predictedDiff === 0 && realDiff === 0); // both draw

    if (sameResult) {
      points = 1;
    }
  }

  // ------------------------------------------------------------------
  // Knockout winner bonus (+1) — group stage never has actualWinnerId
  // ------------------------------------------------------------------
  if (stage !== 'group' && actualWinnerId !== null) {
    // Determine the team the user intended to win.
    // Priority: explicit predictedWinner field ('home'/'away') beats score-derived.
    let userPredictedWinnerId: string | null = null;

    if (predictedWinner === 'home') {
      userPredictedWinnerId = homeTeamId;
    } else if (predictedWinner === 'away') {
      userPredictedWinnerId = awayTeamId;
    } else {
      // Null / empty — fall back to score-derived winner
      if (predictedHome > predictedAway) {
        userPredictedWinnerId = homeTeamId;
      } else if (predictedAway > predictedHome) {
        userPredictedWinnerId = awayTeamId;
      }
      // tied prediction with no explicit winner => null => no bonus
    }

    if (userPredictedWinnerId !== null && userPredictedWinnerId === actualWinnerId) {
      points += 1;
    }
  }

  return points;
}
