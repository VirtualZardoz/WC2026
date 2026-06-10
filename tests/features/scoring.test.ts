/**
 * Scoring Engine Tests
 *
 * Pure-logic tests for calculatePredictionPoints.
 * No DB, no Prisma, no mocks needed — the function is fully pure.
 *
 * Scoring rules (source of truth):
 *   Group:    exact score = 3; correct result = 1; miss = 0.
 *   Knockout: same base PLUS +1 if predicted winner == actual winner (perfect = 4).
 *   isBonusMatch: NO scoring effect. By design (off-platform prizes). Not a parameter.
 */

import { describe, it, expect } from 'vitest';
import { calculatePredictionPoints } from '@/lib/scoring';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const GROUP_CTX = {
  stage: 'group',
  realScoreHome: 0,  // overridden per test
  realScoreAway: 0,
  homeTeamId: 'H',
  awayTeamId: 'A',
  actualWinnerId: null,
};

const KO_CTX = {
  stage: 'round32',
  realScoreHome: 0,  // overridden per test
  realScoreAway: 0,
  homeTeamId: 'H',
  awayTeamId: 'A',
  actualWinnerId: null as string | null,
};

// ---------------------------------------------------------------------------
// Group stage
// ---------------------------------------------------------------------------
describe('Group stage scoring', () => {
  it('exact score => 3', () => {
    const pts = calculatePredictionPoints(
      { predictedHome: 2, predictedAway: 1, predictedWinner: null },
      { ...GROUP_CTX, realScoreHome: 2, realScoreAway: 1 }
    );
    expect(pts).toBe(3);
  });

  it('correct result (home win), wrong score => 1', () => {
    const pts = calculatePredictionPoints(
      { predictedHome: 3, predictedAway: 0, predictedWinner: null },
      { ...GROUP_CTX, realScoreHome: 2, realScoreAway: 1 }
    );
    expect(pts).toBe(1);
  });

  it('wrong result => 0', () => {
    const pts = calculatePredictionPoints(
      { predictedHome: 2, predictedAway: 0, predictedWinner: null },
      { ...GROUP_CTX, realScoreHome: 0, realScoreAway: 1 }
    );
    expect(pts).toBe(0);
  });

  it('correct draw result (predicted 1-1, real 2-2) => 1', () => {
    const pts = calculatePredictionPoints(
      { predictedHome: 1, predictedAway: 1, predictedWinner: null },
      { ...GROUP_CTX, realScoreHome: 2, realScoreAway: 2 }
    );
    expect(pts).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Knockout stage
// ---------------------------------------------------------------------------
describe('Knockout stage scoring', () => {
  it('exact score + correct winner => 4', () => {
    // predicted 2-1, real 2-1, home wins
    const pts = calculatePredictionPoints(
      { predictedHome: 2, predictedAway: 1, predictedWinner: null },
      { ...KO_CTX, realScoreHome: 2, realScoreAway: 1, actualWinnerId: 'H' }
    );
    expect(pts).toBe(4);
  });

  it('correct result + correct winner, wrong score => 2', () => {
    // predicted 3-1 (home), real 2-1 (home), winner H
    const pts = calculatePredictionPoints(
      { predictedHome: 3, predictedAway: 1, predictedWinner: null },
      { ...KO_CTX, realScoreHome: 2, realScoreAway: 1, actualWinnerId: 'H' }
    );
    expect(pts).toBe(2);
  });

  it('winner-only via explicit field: predicted draw 1-1 predictedWinner "home", real 2-0, home wins => 1', () => {
    // predicted 1-1 with explicit 'home' winner, real 2-0 (home wins)
    // result: 1-1 vs 2-0 is wrong result (draw vs home-win) => base 0; but explicit winner matches => +1 => 1
    const pts = calculatePredictionPoints(
      { predictedHome: 1, predictedAway: 1, predictedWinner: 'home' },
      { ...KO_CTX, realScoreHome: 2, realScoreAway: 0, actualWinnerId: 'H' }
    );
    expect(pts).toBe(1);
  });

  it('explicit predictedWinner "home" but away wins => 0', () => {
    // predicted 1-1, predictedWinner 'home', real 0-2 (away wins)
    // base: draw vs away-win => wrong => 0; winner: 'home' maps to 'H', actual 'A' => no bonus => 0
    const pts = calculatePredictionPoints(
      { predictedHome: 1, predictedAway: 1, predictedWinner: 'home' },
      { ...KO_CTX, realScoreHome: 0, realScoreAway: 2, actualWinnerId: 'A' }
    );
    expect(pts).toBe(0);
  });

  it('wrong winner (score-derived): predicted 0-2 (away), real 2-0 (home) => 0', () => {
    // base: away-win vs home-win => wrong => 0; predicted away (A) vs actual home (H) => no bonus => 0
    const pts = calculatePredictionPoints(
      { predictedHome: 0, predictedAway: 2, predictedWinner: null },
      { ...KO_CTX, realScoreHome: 2, realScoreAway: 0, actualWinnerId: 'H' }
    );
    expect(pts).toBe(0);
  });

  it('draw-with-penalty-winner: predicted 1-1 predictedWinner "home", real 1-1, actualWinnerId "H" (penalties) => 4', () => {
    // predicted 1-1 = real 1-1 => exact 3; explicit predictedWinner 'home' => 'H' == actualWinnerId 'H' => +1 => 4
    const pts = calculatePredictionPoints(
      { predictedHome: 1, predictedAway: 1, predictedWinner: 'home' },
      { ...KO_CTX, realScoreHome: 1, realScoreAway: 1, actualWinnerId: 'H' }
    );
    expect(pts).toBe(4);
  });

  it('explicit field BEATS score-derived: predicted 2-1 (implies home), predictedWinner "away", real 0-1, actualWinnerId "A" => 1', () => {
    // predicted 2-1 score-derives to 'H', but explicit 'away' overrides to 'A'
    // real 0-1 (away wins), actualWinnerId 'A'
    // base: home-win (2-1) vs away-win (0-1) => wrong => 0; explicit winner 'A' == actual 'A' => +1 => 1
    const pts = calculatePredictionPoints(
      { predictedHome: 2, predictedAway: 1, predictedWinner: 'away' },
      { ...KO_CTX, realScoreHome: 0, realScoreAway: 1, actualWinnerId: 'A' }
    );
    expect(pts).toBe(1);
  });

  it('score-derived fallback when predictedWinner null: predicted 3-0, real 1-0, actualWinnerId "H" => 2', () => {
    // predicted 3-0 (home win, null winner), real 1-0 (home win)
    // base: wrong score but correct result (home win) => 1; score-derived winner H == actual H => +1 => 2
    const pts = calculatePredictionPoints(
      { predictedHome: 3, predictedAway: 0, predictedWinner: null },
      { ...KO_CTX, realScoreHome: 1, realScoreAway: 0, actualWinnerId: 'H' }
    );
    expect(pts).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// isBonusMatch invariance
// ---------------------------------------------------------------------------
describe('isBonusMatch does not change points', () => {
  it('same inputs produce same points regardless of isBonusMatch flag (isBonusMatch is not a parameter)', () => {
    // The function signature does not include isBonusMatch at all.
    // Demonstrate invariance by calling twice with identical args (pure function).
    const prediction = { predictedHome: 2, predictedAway: 1, predictedWinner: null };
    const ctx = { ...KO_CTX, realScoreHome: 2, realScoreAway: 1, actualWinnerId: 'H' };

    const pts1 = calculatePredictionPoints(prediction, ctx);
    const pts2 = calculatePredictionPoints(prediction, ctx);

    expect(pts1).toBe(pts2);
    expect(pts1).toBe(4); // Exact + winner bonus
  });
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------
describe('Idempotency', () => {
  it('calling twice with identical inputs returns identical result', () => {
    const prediction = { predictedHome: 1, predictedAway: 0, predictedWinner: null };
    const ctx = { ...GROUP_CTX, realScoreHome: 2, realScoreAway: 0 };

    const r1 = calculatePredictionPoints(prediction, ctx);
    const r2 = calculatePredictionPoints(prediction, ctx);

    expect(r1).toBe(r2);
    expect(r1).toBe(1); // Correct result (home win), wrong score
  });
});
