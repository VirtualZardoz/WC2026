# Feature: Dynamic Knockout Bracket Population

## Overview
The knockout stage should automatically populate with teams based on the user's predictions from previous rounds. This creates a cascading bracket where:
- Group stage predictions → determine R32 qualifiers
- R32 predictions → determine R16 qualifiers
- R16 predictions → determine QF qualifiers
- QF predictions → determine SF qualifiers
- SF predictions → determine Final + 3rd place match participants

## Requirements

### 1. Group Standings Calculator
Create a utility that calculates group standings from a user's predictions.

**For each group (A-L):**
- Calculate points: 3 for win, 1 for draw, 0 for loss
- Calculate goal difference (GF - GA)
- Calculate goals scored (GF)
- Rank teams: Points → GD → GF → Head-to-head

**Output:** Ranked list of teams per group (1st, 2nd, 3rd, 4th)

### 2. Best Third-Place Teams
World Cup 2026 format: 8 best 3rd-place teams advance to R32.

**Ranking criteria for 3rd place teams:**
1. Points
2. Goal difference
3. Goals scored
4. Fair play points (skip - not predictable)
5. Drawing of lots (skip - use alphabetical group order as tiebreaker)

**Output:** 8 teams from the 12 third-place finishers

### 3. R32 Bracket Structure
Define the official FIFA World Cup 2026 R32 bracket pairings.

Since FIFA hasn't published the exact bracket, use this logical structure:
```
R32 Match 1: 1A vs 3C/D/E (best 3rd)
R32 Match 2: 2B vs 2A
R32 Match 3: 1B vs 3A/D/E (best 3rd)
... (continue for all 32 matches mapping group positions to knockout slots)
```

**Note:** The exact bracket structure should follow FIFA's eventual announcement. For now, create a sensible mapping that can be updated later.

### 4. Knockout Progression
For each knockout round, determine the winner based on user's prediction:

**Winner determination:**
- If predictedHome > predictedAway → Home team advances
- If predictedAway > predictedHome → Away team advances
- If draw in knockout → use `predictedWinner` field ('home' or 'away')

**Cascade logic:**
```
getUserPredictedWinner(match) → team that advances
Next round match gets this team in appropriate slot (home/away)
```

### 5. UI Updates

**MatchCard changes:**
- Instead of showing "Winner 1" placeholder, show the actual predicted team name
- Show flag of predicted team
- If prediction incomplete, show "TBD" or the original placeholder

**Knockout bracket view:**
- Visually show the bracket with predicted teams flowing through
- Highlight path to predicted champion

### 6. Edge Cases

**Incomplete predictions:**
- If group predictions incomplete → show "TBD" for that group's qualifiers
- If knockout prediction missing → show both potential teams or "Winner of Match X"

**No prediction for a match:**
- Cannot determine winner → subsequent rounds show placeholder

**Ties in group standings:**
- Apply tiebreakers in order
- If still tied after all tiebreakers, use alphabetical team name

### 7. Data Flow

```
User's Predictions (DB)
    ↓
calculateGroupStandings(userId, groupMatches, predictions)
    ↓
{ groupA: [1st, 2nd, 3rd, 4th], groupB: [...], ... }
    ↓
determineBestThirds(standings)
    ↓
[8 best 3rd place teams]
    ↓
populateR32Bracket(standings, bestThirds)
    ↓
{ match73: { home: Team, away: Team }, ... }
    ↓
For each knockout round:
  getKnockoutWinner(prediction) → advancing team
    ↓
  populate next round
```

### 8. Implementation Files

**New files:**
- `lib/knockout-bracket.ts` - Bracket structure and population logic
- `lib/standings-calculator.ts` - Group standings calculation

**Modified files:**
- `components/MatchCard.tsx` - Show predicted teams instead of placeholders
- `components/KnockoutBracket.tsx` - Use calculated teams
- `app/(main)/predictions/PredictionsClient.tsx` - Pass calculated bracket data

### 9. Testing

**Unit tests for:**
- Group standings calculation with various score combinations
- Tiebreaker logic
- Best third-place ranking
- Knockout winner determination
- Bracket population

**Integration tests:**
- Full flow from group predictions to final bracket
- Edge cases with missing predictions

### 10. Acceptance Criteria

- [ ] User predicts Group A matches → R32 shows predicted 1A, 2A teams
- [ ] User predicts all groups → all 32 R32 slots populated with predicted teams
- [ ] User predicts R32 match → R16 shows predicted winner
- [ ] Cascade works through to Final
- [ ] Missing predictions show appropriate placeholder
- [ ] Flags display correctly for predicted teams
- [ ] Knockout bracket view shows full predicted bracket path
