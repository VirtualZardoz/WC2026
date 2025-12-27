/**
 * Leaderboard Feature Tests
 *
 * Tests for leaderboard functionality including:
 * - Bonus match calculation
 * - Ranking stability (crown stays with #1 regardless of sort)
 * - Phase filtering (Overall, Group, Knockout, Bonus)
 */

import { describe, it, expect } from 'vitest';

// Mock leaderboard entry type matching the component
interface LeaderboardEntry {
  id: string;
  name: string;
  totalPoints: number;
  groupPoints: number;
  knockoutPoints: number;
  bonusMatchPoints: number;
  bonusMatchExact: number;
  exactScores: number;
  correctResults: number;
  predictedCount: number;
}

// Helper to create mock entries
function createMockEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test User',
    totalPoints: 50,
    groupPoints: 30,
    knockoutPoints: 20,
    bonusMatchPoints: 6,
    bonusMatchExact: 2,
    exactScores: 10,
    correctResults: 20,
    predictedCount: 104,
    ...overrides,
  };
}

describe('Leaderboard Feature Tests', () => {
  describe('Phase Filtering', () => {
    const getPoints = (entry: LeaderboardEntry, phase: string) => {
      if (phase === 'group') return entry.groupPoints;
      if (phase === 'knockout') return entry.knockoutPoints;
      if (phase === 'bonus') return entry.bonusMatchPoints;
      return entry.totalPoints;
    };

    it('should return totalPoints for "all" phase', () => {
      const entry = createMockEntry({ totalPoints: 100 });
      expect(getPoints(entry, 'all')).toBe(100);
    });

    it('should return groupPoints for "group" phase', () => {
      const entry = createMockEntry({ groupPoints: 45 });
      expect(getPoints(entry, 'group')).toBe(45);
    });

    it('should return knockoutPoints for "knockout" phase', () => {
      const entry = createMockEntry({ knockoutPoints: 25 });
      expect(getPoints(entry, 'knockout')).toBe(25);
    });

    it('should return bonusMatchPoints for "bonus" phase', () => {
      const entry = createMockEntry({ bonusMatchPoints: 9 });
      expect(getPoints(entry, 'bonus')).toBe(9);
    });
  });

  describe('Ranking Stability (Crown Bug Fix)', () => {
    // Simulates the ranking logic from LeaderboardClient
    function calculateRanks(
      leaderboard: LeaderboardEntry[],
      phase: string
    ): Map<string, number> {
      const getPoints = (entry: LeaderboardEntry) => {
        if (phase === 'group') return entry.groupPoints;
        if (phase === 'knockout') return entry.knockoutPoints;
        if (phase === 'bonus') return entry.bonusMatchPoints;
        return entry.totalPoints;
      };

      const pointsSorted = [...leaderboard].sort((a, b) => getPoints(b) - getPoints(a));
      let currentRank = 0;
      let currentVal = -1;
      const rankMap = new Map<string, number>();

      pointsSorted.forEach((entry, index) => {
        const val = getPoints(entry);
        if (val !== currentVal) {
          currentRank = index + 1;
          currentVal = val;
        }
        rankMap.set(entry.id, currentRank);
      });

      return rankMap;
    }

    it('should assign rank 1 to user with highest points', () => {
      const entries = [
        createMockEntry({ id: 'user-1', totalPoints: 100 }),
        createMockEntry({ id: 'user-2', totalPoints: 80 }),
        createMockEntry({ id: 'user-3', totalPoints: 60 }),
      ];

      const ranks = calculateRanks(entries, 'all');
      expect(ranks.get('user-1')).toBe(1);
      expect(ranks.get('user-2')).toBe(2);
      expect(ranks.get('user-3')).toBe(3);
    });

    it('should maintain ranks regardless of display sort order', () => {
      const entries = [
        createMockEntry({ id: 'user-1', name: 'Zara', totalPoints: 100 }),
        createMockEntry({ id: 'user-2', name: 'Alice', totalPoints: 80 }),
        createMockEntry({ id: 'user-3', name: 'Bob', totalPoints: 60 }),
      ];

      // Calculate ranks based on points
      const ranks = calculateRanks(entries, 'all');

      // Sort by name ascending (Alice, Bob, Zara)
      const sortedByName = [...entries].sort((a, b) => a.name.localeCompare(b.name));

      // Even though Alice is first in display, Zara should still have rank 1
      expect(sortedByName[0].name).toBe('Alice');
      expect(ranks.get(sortedByName[0].id)).toBe(2); // Alice is rank 2

      // Zara is last in display but still rank 1
      expect(sortedByName[2].name).toBe('Zara');
      expect(ranks.get(sortedByName[2].id)).toBe(1); // Zara is rank 1
    });

    it('should give same rank to users with equal points', () => {
      const entries = [
        createMockEntry({ id: 'user-1', totalPoints: 100 }),
        createMockEntry({ id: 'user-2', totalPoints: 100 }),
        createMockEntry({ id: 'user-3', totalPoints: 80 }),
      ];

      const ranks = calculateRanks(entries, 'all');
      expect(ranks.get('user-1')).toBe(1);
      expect(ranks.get('user-2')).toBe(1); // Tied for first
      expect(ranks.get('user-3')).toBe(3); // Skips to 3, not 2
    });

    it('should calculate separate ranks for bonus phase', () => {
      const entries = [
        createMockEntry({ id: 'user-1', totalPoints: 100, bonusMatchPoints: 3 }),
        createMockEntry({ id: 'user-2', totalPoints: 80, bonusMatchPoints: 9 }),
        createMockEntry({ id: 'user-3', totalPoints: 60, bonusMatchPoints: 6 }),
      ];

      const overallRanks = calculateRanks(entries, 'all');
      const bonusRanks = calculateRanks(entries, 'bonus');

      // Overall: user-1 is #1
      expect(overallRanks.get('user-1')).toBe(1);
      expect(overallRanks.get('user-2')).toBe(2);

      // Bonus: user-2 is #1 (most bonus points)
      expect(bonusRanks.get('user-2')).toBe(1);
      expect(bonusRanks.get('user-3')).toBe(2);
      expect(bonusRanks.get('user-1')).toBe(3);
    });
  });

  describe('Bonus Match Calculation', () => {
    interface Prediction {
      matchId: string;
      pointsEarned: number;
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

      return { bonusMatchExact, bonusMatchPoints };
    }

    it('should calculate bonus points from bonus matches only', () => {
      const bonusMatchIds = new Set(['match-1', 'match-3']);
      const predictions = [
        { matchId: 'match-1', pointsEarned: 3 }, // bonus
        { matchId: 'match-2', pointsEarned: 3 }, // not bonus
        { matchId: 'match-3', pointsEarned: 1 }, // bonus
      ];

      const stats = calculateBonusStats(predictions, bonusMatchIds);
      expect(stats.bonusMatchPoints).toBe(4); // 3 + 1
    });

    it('should count exact scores on bonus matches', () => {
      const bonusMatchIds = new Set(['match-1', 'match-2', 'match-3']);
      const predictions = [
        { matchId: 'match-1', pointsEarned: 3 }, // exact
        { matchId: 'match-2', pointsEarned: 4 }, // exact + knockout bonus
        { matchId: 'match-3', pointsEarned: 1 }, // not exact
      ];

      const stats = calculateBonusStats(predictions, bonusMatchIds);
      expect(stats.bonusMatchExact).toBe(2); // match-1 and match-2
    });

    it('should return 0 when no bonus matches defined', () => {
      const bonusMatchIds = new Set<string>();
      const predictions = [
        { matchId: 'match-1', pointsEarned: 3 },
        { matchId: 'match-2', pointsEarned: 3 },
      ];

      const stats = calculateBonusStats(predictions, bonusMatchIds);
      expect(stats.bonusMatchPoints).toBe(0);
      expect(stats.bonusMatchExact).toBe(0);
    });

    it('should return 0 when user has no predictions on bonus matches', () => {
      const bonusMatchIds = new Set(['match-99', 'match-100']);
      const predictions = [
        { matchId: 'match-1', pointsEarned: 3 },
        { matchId: 'match-2', pointsEarned: 3 },
      ];

      const stats = calculateBonusStats(predictions, bonusMatchIds);
      expect(stats.bonusMatchPoints).toBe(0);
      expect(stats.bonusMatchExact).toBe(0);
    });
  });

  describe('Leaderboard Sorting', () => {
    type SortField = 'points' | 'exactScores' | 'name' | 'bonus';

    function sortLeaderboard(
      entries: LeaderboardEntry[],
      sortField: SortField,
      sortAsc: boolean,
      phase: string
    ): LeaderboardEntry[] {
      const getPoints = (entry: LeaderboardEntry) => {
        if (phase === 'group') return entry.groupPoints;
        if (phase === 'knockout') return entry.knockoutPoints;
        if (phase === 'bonus') return entry.bonusMatchPoints;
        return entry.totalPoints;
      };

      return [...entries].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'points':
            comparison = getPoints(b) - getPoints(a);
            break;
          case 'exactScores':
            comparison = b.exactScores - a.exactScores;
            break;
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'bonus':
            comparison = b.bonusMatchPoints - a.bonusMatchPoints;
            break;
        }
        return sortAsc ? -comparison : comparison;
      });
    }

    it('should sort by points descending by default', () => {
      const entries = [
        createMockEntry({ id: 'a', totalPoints: 50 }),
        createMockEntry({ id: 'b', totalPoints: 100 }),
        createMockEntry({ id: 'c', totalPoints: 75 }),
      ];

      const sorted = sortLeaderboard(entries, 'points', false, 'all');
      expect(sorted[0].id).toBe('b');
      expect(sorted[1].id).toBe('c');
      expect(sorted[2].id).toBe('a');
    });

    it('should sort by name alphabetically when selected', () => {
      const entries = [
        createMockEntry({ id: 'a', name: 'Zara' }),
        createMockEntry({ id: 'b', name: 'Alice' }),
        createMockEntry({ id: 'c', name: 'Mike' }),
      ];

      const sorted = sortLeaderboard(entries, 'name', false, 'all');
      expect(sorted[0].name).toBe('Alice');
      expect(sorted[1].name).toBe('Mike');
      expect(sorted[2].name).toBe('Zara');
    });

    it('should sort by bonus points when in bonus phase', () => {
      const entries = [
        createMockEntry({ id: 'a', bonusMatchPoints: 3 }),
        createMockEntry({ id: 'b', bonusMatchPoints: 9 }),
        createMockEntry({ id: 'c', bonusMatchPoints: 6 }),
      ];

      const sorted = sortLeaderboard(entries, 'bonus', false, 'bonus');
      expect(sorted[0].id).toBe('b'); // 9 points
      expect(sorted[1].id).toBe('c'); // 6 points
      expect(sorted[2].id).toBe('a'); // 3 points
    });

    it('should reverse order when sortAsc is true', () => {
      const entries = [
        createMockEntry({ id: 'a', totalPoints: 50 }),
        createMockEntry({ id: 'b', totalPoints: 100 }),
      ];

      const sorted = sortLeaderboard(entries, 'points', true, 'all');
      expect(sorted[0].id).toBe('a'); // Lower points first
      expect(sorted[1].id).toBe('b');
    });
  });
});
