/**
 * Bonus Matches Feature Tests
 *
 * Tests for bonus match functionality including:
 * - Bonus match identification
 * - User detail page bonus stats
 * - Admin bonus match configuration limits
 */

import { describe, it, expect } from 'vitest';

describe('Bonus Matches Feature Tests', () => {
  describe('Bonus Match Identification', () => {
    interface Match {
      id: string;
      matchNumber: number;
      isBonusMatch: boolean;
    }

    interface Prediction {
      id: string;
      matchId: string;
      pointsEarned: number;
      match: {
        realScoreHome: number | null;
      };
    }

    function getBonusMatchIds(matches: Match[]): Set<string> {
      return new Set(matches.filter((m) => m.isBonusMatch).map((m) => m.id));
    }

    function isBonusMatch(matchId: string, bonusMatchIds: Set<string>): boolean {
      return bonusMatchIds.has(matchId);
    }

    it('should identify bonus matches from match list', () => {
      const matches: Match[] = [
        { id: 'match-1', matchNumber: 1, isBonusMatch: false },
        { id: 'match-2', matchNumber: 2, isBonusMatch: true },
        { id: 'match-3', matchNumber: 3, isBonusMatch: false },
        { id: 'match-104', matchNumber: 104, isBonusMatch: true }, // Final
      ];

      const bonusIds = getBonusMatchIds(matches);

      expect(bonusIds.size).toBe(2);
      expect(bonusIds.has('match-2')).toBe(true);
      expect(bonusIds.has('match-104')).toBe(true);
      expect(bonusIds.has('match-1')).toBe(false);
    });

    it('should return empty set when no bonus matches', () => {
      const matches: Match[] = [
        { id: 'match-1', matchNumber: 1, isBonusMatch: false },
        { id: 'match-2', matchNumber: 2, isBonusMatch: false },
      ];

      const bonusIds = getBonusMatchIds(matches);
      expect(bonusIds.size).toBe(0);
    });

    it('should correctly check if match is bonus', () => {
      const bonusIds = new Set(['match-100', 'match-104']);

      expect(isBonusMatch('match-100', bonusIds)).toBe(true);
      expect(isBonusMatch('match-104', bonusIds)).toBe(true);
      expect(isBonusMatch('match-1', bonusIds)).toBe(false);
    });
  });

  describe('User Detail Page Bonus Stats', () => {
    interface Prediction {
      matchId: string;
      pointsEarned: number;
      match: {
        realScoreHome: number | null;
      };
    }

    function calculateBonusStats(
      predictions: Prediction[],
      bonusMatchIds: Set<string>
    ) {
      const bonusPredictions = predictions.filter((p) =>
        bonusMatchIds.has(p.matchId)
      );
      const bonusMatchExact = bonusPredictions.filter(
        (p) => p.pointsEarned >= 3
      ).length;
      const bonusMatchPoints = bonusPredictions.reduce(
        (sum, p) => sum + p.pointsEarned,
        0
      );
      const bonusMatchesPlayed = bonusPredictions.filter(
        (p) => p.match.realScoreHome !== null
      ).length;

      return { bonusMatchExact, bonusMatchPoints, bonusMatchesPlayed };
    }

    it('should calculate correct bonus exact count', () => {
      const bonusMatchIds = new Set(['m1', 'm2', 'm3']);
      const predictions: Prediction[] = [
        { matchId: 'm1', pointsEarned: 3, match: { realScoreHome: 2 } }, // exact
        { matchId: 'm2', pointsEarned: 1, match: { realScoreHome: 1 } }, // correct result only
        { matchId: 'm3', pointsEarned: 4, match: { realScoreHome: 0 } }, // exact + knockout bonus
        { matchId: 'm4', pointsEarned: 3, match: { realScoreHome: 2 } }, // not a bonus match
      ];

      const stats = calculateBonusStats(predictions, bonusMatchIds);
      expect(stats.bonusMatchExact).toBe(2); // m1 and m3
    });

    it('should calculate correct bonus points total', () => {
      const bonusMatchIds = new Set(['m1', 'm2']);
      const predictions: Prediction[] = [
        { matchId: 'm1', pointsEarned: 3, match: { realScoreHome: 2 } },
        { matchId: 'm2', pointsEarned: 1, match: { realScoreHome: 1 } },
        { matchId: 'm3', pointsEarned: 3, match: { realScoreHome: 2 } }, // not bonus
      ];

      const stats = calculateBonusStats(predictions, bonusMatchIds);
      expect(stats.bonusMatchPoints).toBe(4); // 3 + 1
    });

    it('should count only played bonus matches', () => {
      const bonusMatchIds = new Set(['m1', 'm2', 'm3']);
      const predictions: Prediction[] = [
        { matchId: 'm1', pointsEarned: 3, match: { realScoreHome: 2 } }, // played
        { matchId: 'm2', pointsEarned: 0, match: { realScoreHome: null } }, // not played
        { matchId: 'm3', pointsEarned: 1, match: { realScoreHome: 1 } }, // played
      ];

      const stats = calculateBonusStats(predictions, bonusMatchIds);
      expect(stats.bonusMatchesPlayed).toBe(2);
    });

    it('should handle user with no bonus match predictions', () => {
      const bonusMatchIds = new Set(['m100', 'm101']);
      const predictions: Prediction[] = [
        { matchId: 'm1', pointsEarned: 3, match: { realScoreHome: 2 } },
        { matchId: 'm2', pointsEarned: 1, match: { realScoreHome: 1 } },
      ];

      const stats = calculateBonusStats(predictions, bonusMatchIds);
      expect(stats.bonusMatchExact).toBe(0);
      expect(stats.bonusMatchPoints).toBe(0);
      expect(stats.bonusMatchesPlayed).toBe(0);
    });

    it('should handle empty predictions', () => {
      const bonusMatchIds = new Set(['m1', 'm2']);
      const predictions: Prediction[] = [];

      const stats = calculateBonusStats(predictions, bonusMatchIds);
      expect(stats.bonusMatchExact).toBe(0);
      expect(stats.bonusMatchPoints).toBe(0);
      expect(stats.bonusMatchesPlayed).toBe(0);
    });
  });

  describe('Admin Bonus Match Configuration', () => {
    const MAX_BONUS_MATCHES = 5;
    const MIN_BONUS_MATCHES = 3;

    function canAddBonusMatch(currentCount: number): boolean {
      return currentCount < MAX_BONUS_MATCHES;
    }

    function canRemoveBonusMatch(currentCount: number): boolean {
      return currentCount > 0;
    }

    function isValidBonusCount(count: number): boolean {
      return count >= MIN_BONUS_MATCHES && count <= MAX_BONUS_MATCHES;
    }

    it('should allow adding bonus match when under limit', () => {
      expect(canAddBonusMatch(0)).toBe(true);
      expect(canAddBonusMatch(1)).toBe(true);
      expect(canAddBonusMatch(4)).toBe(true);
    });

    it('should prevent adding bonus match at limit', () => {
      expect(canAddBonusMatch(5)).toBe(false);
      expect(canAddBonusMatch(6)).toBe(false);
    });

    it('should allow removing bonus match when count > 0', () => {
      expect(canRemoveBonusMatch(5)).toBe(true);
      expect(canRemoveBonusMatch(1)).toBe(true);
    });

    it('should prevent removing when count is 0', () => {
      expect(canRemoveBonusMatch(0)).toBe(false);
    });

    it('should validate bonus count in recommended range', () => {
      expect(isValidBonusCount(3)).toBe(true);
      expect(isValidBonusCount(4)).toBe(true);
      expect(isValidBonusCount(5)).toBe(true);
    });

    it('should reject invalid bonus counts', () => {
      expect(isValidBonusCount(0)).toBe(false);
      expect(isValidBonusCount(2)).toBe(false);
      expect(isValidBonusCount(6)).toBe(false);
    });
  });

  describe('Bonus Match Points Scoring', () => {
    // Based on the scoring system in README.md
    const EXACT_SCORE_POINTS = 3;
    const CORRECT_RESULT_POINTS = 1;
    const KNOCKOUT_BONUS_POINTS = 1;

    interface MatchResult {
      predictedHome: number;
      predictedAway: number;
      actualHome: number;
      actualAway: number;
      isKnockout: boolean;
      predictedWinner?: 'home' | 'away' | null;
      actualWinner?: 'home' | 'away' | null;
    }

    function calculatePoints(result: MatchResult): number {
      let points = 0;

      // Exact score
      if (
        result.predictedHome === result.actualHome &&
        result.predictedAway === result.actualAway
      ) {
        points += EXACT_SCORE_POINTS;
      } else {
        // Correct result (win/draw/loss)
        const predictedResult =
          result.predictedHome > result.predictedAway
            ? 'home'
            : result.predictedHome < result.predictedAway
            ? 'away'
            : 'draw';
        const actualResult =
          result.actualHome > result.actualAway
            ? 'home'
            : result.actualHome < result.actualAway
            ? 'away'
            : 'draw';

        if (predictedResult === actualResult) {
          points += CORRECT_RESULT_POINTS;
        }
      }

      // Knockout bonus: correctly predicted qualifier
      if (
        result.isKnockout &&
        result.predictedWinner &&
        result.predictedWinner === result.actualWinner
      ) {
        points += KNOCKOUT_BONUS_POINTS;
      }

      return points;
    }

    it('should award 3 points for exact score', () => {
      const points = calculatePoints({
        predictedHome: 2,
        predictedAway: 1,
        actualHome: 2,
        actualAway: 1,
        isKnockout: false,
      });
      expect(points).toBe(3);
    });

    it('should award 1 point for correct result', () => {
      const points = calculatePoints({
        predictedHome: 3,
        predictedAway: 0,
        actualHome: 2,
        actualAway: 1,
        isKnockout: false,
      });
      expect(points).toBe(1); // Both home wins
    });

    it('should award 0 points for wrong result', () => {
      const points = calculatePoints({
        predictedHome: 2,
        predictedAway: 0,
        actualHome: 0,
        actualAway: 1,
        isKnockout: false,
      });
      expect(points).toBe(0);
    });

    it('should award knockout bonus for correct qualifier', () => {
      const points = calculatePoints({
        predictedHome: 1,
        predictedAway: 0,
        actualHome: 2,
        actualAway: 1,
        isKnockout: true,
        predictedWinner: 'home',
        actualWinner: 'home',
      });
      expect(points).toBe(2); // 1 (result) + 1 (knockout bonus)
    });

    it('should award exact + knockout bonus', () => {
      const points = calculatePoints({
        predictedHome: 2,
        predictedAway: 1,
        actualHome: 2,
        actualAway: 1,
        isKnockout: true,
        predictedWinner: 'home',
        actualWinner: 'home',
      });
      expect(points).toBe(4); // 3 (exact) + 1 (knockout bonus)
    });

    it('should handle draw predictions', () => {
      const points = calculatePoints({
        predictedHome: 1,
        predictedAway: 1,
        actualHome: 0,
        actualAway: 0,
        isKnockout: false,
      });
      expect(points).toBe(1); // Correct result (draw)
    });
  });
});
