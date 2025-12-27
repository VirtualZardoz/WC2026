/**
 * Knockout Cascade Resolution Tests
 *
 * Tests for knockout bracket team resolution including:
 * - Group winner/runner-up resolution from placeholders
 * - Best third place resolution
 * - Knockout winner/loser cascade through rounds
 * - User predictions vs admin cascade independence
 */

import { describe, it, expect } from 'vitest';

// Types matching the component
interface Team {
  id: string;
  name: string;
  code: string;
}

interface PredictedQualifiers {
  winners: { [group: string]: Team | null };
  runnersUp: { [group: string]: Team | null };
  bestThirds: (Team | null)[];
}

interface Match {
  id: string;
  matchNumber: number;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
}

// Helper to create mock team
function createTeam(name: string, code: string): Team {
  return { id: `team-${code}`, name, code };
}

// Placeholder resolution logic (extracted from KnockoutBracket.tsx)
function resolveTeamFromPlaceholder(
  placeholder: string | null,
  match: Match,
  predictedQualifiers: PredictedQualifiers,
  predictedWinners: { [matchNum: number]: Team | null },
  predictedLosers: { [matchNum: number]: Team | null },
  r32ThirdMatches: Match[],
  stageOffsets: { [key: string]: number }
): Team | null {
  if (!placeholder) return null;

  // Group winner: "Winner A", "Winner B", etc.
  if (placeholder.startsWith('Winner ') && placeholder.split(' ')[1].length === 1) {
    const group = placeholder.split(' ')[1];
    return predictedQualifiers.winners[group] || null;
  }

  // Group runner-up: "Runner-up A", "Runner-up B", etc.
  if (placeholder.startsWith('Runner-up ')) {
    const group = placeholder.split(' ')[1];
    return predictedQualifiers.runnersUp[group] || null;
  }

  // Best third place: "3rd C/D/E", etc.
  if (placeholder.startsWith('3rd ')) {
    const idx = r32ThirdMatches.findIndex((m) => m.id === match.id);
    if (idx >= 0 && predictedQualifiers.bestThirds[idx]) {
      return predictedQualifiers.bestThirds[idx];
    }
    return null;
  }

  // Knockout round winner: "Winner R32 M1", "Winner R16 M1", etc.
  const winnerMatch = placeholder.match(/^Winner (R32|R16|QF|SF) M(\d+)$/);
  if (winnerMatch) {
    const [, stage, matchNum] = winnerMatch;
    const matchNumber = stageOffsets[stage] + parseInt(matchNum);
    return predictedWinners[matchNumber] || null;
  }

  // Knockout round loser (for 3rd place match): "Loser SF M1", etc.
  const loserMatch = placeholder.match(/^Loser (SF) M(\d+)$/);
  if (loserMatch) {
    const [, stage, matchNum] = loserMatch;
    const matchNumber = stageOffsets[stage] + parseInt(matchNum);
    return predictedLosers[matchNumber] || null;
  }

  // Alternative winner format: "Winner Match 73"
  if (placeholder.startsWith('Winner Match ')) {
    const num = parseInt(placeholder.split(' ')[2]);
    return predictedWinners[num] || null;
  }

  return null;
}

describe('Knockout Cascade Resolution Tests', () => {
  const stageOffsets = { R32: 72, R16: 88, QF: 96, SF: 100 };

  describe('Group Winner Resolution', () => {
    it('should resolve "Winner A" to group A winner', () => {
      const qualifiers: PredictedQualifiers = {
        winners: { A: createTeam('France', 'fra') },
        runnersUp: {},
        bestThirds: [],
      };

      const match: Match = {
        id: 'match-73',
        matchNumber: 73,
        homePlaceholder: 'Winner A',
        awayPlaceholder: null,
        homeTeam: null,
        awayTeam: null,
      };

      const result = resolveTeamFromPlaceholder(
        'Winner A',
        match,
        qualifiers,
        {},
        {},
        [],
        stageOffsets
      );

      expect(result?.name).toBe('France');
      expect(result?.code).toBe('fra');
    });

    it('should return null for missing group winner', () => {
      const qualifiers: PredictedQualifiers = {
        winners: {},
        runnersUp: {},
        bestThirds: [],
      };

      const result = resolveTeamFromPlaceholder(
        'Winner B',
        {} as Match,
        qualifiers,
        {},
        {},
        [],
        stageOffsets
      );

      expect(result).toBeNull();
    });

    it('should resolve all 12 group winners (A-L)', () => {
      const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      const qualifiers: PredictedQualifiers = {
        winners: Object.fromEntries(
          groups.map((g) => [g, createTeam(`Team ${g}`, g.toLowerCase())])
        ),
        runnersUp: {},
        bestThirds: [],
      };

      groups.forEach((group) => {
        const result = resolveTeamFromPlaceholder(
          `Winner ${group}`,
          {} as Match,
          qualifiers,
          {},
          {},
          [],
          stageOffsets
        );
        expect(result?.name).toBe(`Team ${group}`);
      });
    });
  });

  describe('Group Runner-up Resolution', () => {
    it('should resolve "Runner-up A" to group A runner-up', () => {
      const qualifiers: PredictedQualifiers = {
        winners: {},
        runnersUp: { A: createTeam('Germany', 'ger') },
        bestThirds: [],
      };

      const result = resolveTeamFromPlaceholder(
        'Runner-up A',
        {} as Match,
        qualifiers,
        {},
        {},
        [],
        stageOffsets
      );

      expect(result?.name).toBe('Germany');
    });

    it('should return null for missing runner-up', () => {
      const qualifiers: PredictedQualifiers = {
        winners: {},
        runnersUp: {},
        bestThirds: [],
      };

      const result = resolveTeamFromPlaceholder(
        'Runner-up C',
        {} as Match,
        qualifiers,
        {},
        {},
        [],
        stageOffsets
      );

      expect(result).toBeNull();
    });
  });

  describe('Best Third Place Resolution', () => {
    it('should resolve 3rd place teams by position', () => {
      const thirdMatch1: Match = {
        id: 'match-75',
        matchNumber: 75,
        homePlaceholder: 'Winner C',
        awayPlaceholder: '3rd A/B/C',
        homeTeam: null,
        awayTeam: null,
      };

      const qualifiers: PredictedQualifiers = {
        winners: {},
        runnersUp: {},
        bestThirds: [createTeam('Portugal', 'por'), createTeam('Netherlands', 'ned')],
      };

      const r32ThirdMatches = [thirdMatch1];

      const result = resolveTeamFromPlaceholder(
        '3rd A/B/C',
        thirdMatch1,
        qualifiers,
        {},
        {},
        r32ThirdMatches,
        stageOffsets
      );

      expect(result?.name).toBe('Portugal'); // First best third
    });

    it('should return null for out of range third index', () => {
      const match: Match = {
        id: 'match-999',
        matchNumber: 999,
        homePlaceholder: null,
        awayPlaceholder: '3rd X/Y/Z',
        homeTeam: null,
        awayTeam: null,
      };

      const qualifiers: PredictedQualifiers = {
        winners: {},
        runnersUp: {},
        bestThirds: [],
      };

      const result = resolveTeamFromPlaceholder(
        '3rd X/Y/Z',
        match,
        qualifiers,
        {},
        {},
        [], // No third matches
        stageOffsets
      );

      expect(result).toBeNull();
    });
  });

  describe('Knockout Round Winner Cascade', () => {
    it('should resolve "Winner R32 M1" from predicted winners', () => {
      const predictedWinners = {
        73: createTeam('Brazil', 'bra'), // Match 73 = R32 offset (72) + M1
      };

      const result = resolveTeamFromPlaceholder(
        'Winner R32 M1',
        {} as Match,
        { winners: {}, runnersUp: {}, bestThirds: [] },
        predictedWinners,
        {},
        [],
        stageOffsets
      );

      expect(result?.name).toBe('Brazil');
    });

    it('should resolve "Winner R16 M1" from predicted winners', () => {
      const predictedWinners = {
        89: createTeam('Argentina', 'arg'), // Match 89 = R16 offset (88) + M1
      };

      const result = resolveTeamFromPlaceholder(
        'Winner R16 M1',
        {} as Match,
        { winners: {}, runnersUp: {}, bestThirds: [] },
        predictedWinners,
        {},
        [],
        stageOffsets
      );

      expect(result?.name).toBe('Argentina');
    });

    it('should cascade through multiple rounds', () => {
      // Simulate: R32 winner -> R16 -> QF -> SF -> Final
      const predictedWinners = {
        73: createTeam('Spain', 'esp'),     // R32 M1 winner
        89: createTeam('Spain', 'esp'),     // R16 M1 winner (from R32)
        97: createTeam('Spain', 'esp'),     // QF M1 winner (from R16)
        101: createTeam('Spain', 'esp'),    // SF M1 winner (from QF)
      };

      // Check each stage resolution
      expect(
        resolveTeamFromPlaceholder(
          'Winner R32 M1',
          {} as Match,
          { winners: {}, runnersUp: {}, bestThirds: [] },
          predictedWinners,
          {},
          [],
          stageOffsets
        )?.name
      ).toBe('Spain');

      expect(
        resolveTeamFromPlaceholder(
          'Winner SF M1',
          {} as Match,
          { winners: {}, runnersUp: {}, bestThirds: [] },
          predictedWinners,
          {},
          [],
          stageOffsets
        )?.name
      ).toBe('Spain');
    });
  });

  describe('Third Place Match (Loser Resolution)', () => {
    it('should resolve "Loser SF M1" for third place match', () => {
      const predictedLosers = {
        101: createTeam('England', 'eng'), // SF M1 loser
      };

      const result = resolveTeamFromPlaceholder(
        'Loser SF M1',
        {} as Match,
        { winners: {}, runnersUp: {}, bestThirds: [] },
        {},
        predictedLosers,
        [],
        stageOffsets
      );

      expect(result?.name).toBe('England');
    });

    it('should resolve both SF losers for third place match', () => {
      const predictedLosers = {
        101: createTeam('France', 'fra'),   // SF M1 loser
        102: createTeam('Germany', 'ger'),  // SF M2 loser
      };

      const home = resolveTeamFromPlaceholder(
        'Loser SF M1',
        {} as Match,
        { winners: {}, runnersUp: {}, bestThirds: [] },
        {},
        predictedLosers,
        [],
        stageOffsets
      );

      const away = resolveTeamFromPlaceholder(
        'Loser SF M2',
        {} as Match,
        { winners: {}, runnersUp: {}, bestThirds: [] },
        {},
        predictedLosers,
        [],
        stageOffsets
      );

      expect(home?.name).toBe('France');
      expect(away?.name).toBe('Germany');
    });
  });

  describe('Alternative Placeholder Formats', () => {
    it('should resolve "Winner Match 73" format', () => {
      const predictedWinners = {
        73: createTeam('Italy', 'ita'),
      };

      const result = resolveTeamFromPlaceholder(
        'Winner Match 73',
        {} as Match,
        { winners: {}, runnersUp: {}, bestThirds: [] },
        predictedWinners,
        {},
        [],
        stageOffsets
      );

      expect(result?.name).toBe('Italy');
    });
  });

  describe('User Predictions Independence', () => {
    it('should use user predicted qualifiers, not DB teams', () => {
      // This is the key fix: knockout teams come from user predictions
      const userPredictedQualifiers: PredictedQualifiers = {
        winners: { A: createTeam('Japan', 'jpn') },  // User predicts Japan wins A
        runnersUp: { A: createTeam('USA', 'usa') },
        bestThirds: [],
      };

      // Even if admin has different results in DB, user sees their predictions
      const match: Match = {
        id: 'match-73',
        matchNumber: 73,
        homePlaceholder: 'Winner A',
        awayPlaceholder: 'Runner-up B',
        homeTeam: createTeam('France', 'fra'), // Admin's actual result
        awayTeam: null,
      };

      const result = resolveTeamFromPlaceholder(
        'Winner A',
        match,
        userPredictedQualifiers,
        {},
        {},
        [],
        stageOffsets
      );

      // User sees Japan (their prediction), not France (admin result)
      expect(result?.name).toBe('Japan');
    });
  });

  describe('Edge Cases', () => {
    it('should return null for null placeholder', () => {
      const result = resolveTeamFromPlaceholder(
        null,
        {} as Match,
        { winners: {}, runnersUp: {}, bestThirds: [] },
        {},
        {},
        [],
        stageOffsets
      );

      expect(result).toBeNull();
    });

    it('should return null for unknown placeholder format', () => {
      const result = resolveTeamFromPlaceholder(
        'Unknown Format XYZ',
        {} as Match,
        { winners: {}, runnersUp: {}, bestThirds: [] },
        {},
        {},
        [],
        stageOffsets
      );

      expect(result).toBeNull();
    });

    it('should handle empty qualifiers gracefully', () => {
      const emptyQualifiers: PredictedQualifiers = {
        winners: {},
        runnersUp: {},
        bestThirds: [],
      };

      expect(
        resolveTeamFromPlaceholder('Winner A', {} as Match, emptyQualifiers, {}, {}, [], stageOffsets)
      ).toBeNull();

      expect(
        resolveTeamFromPlaceholder('Runner-up A', {} as Match, emptyQualifiers, {}, {}, [], stageOffsets)
      ).toBeNull();
    });
  });
});
