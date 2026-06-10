# Project State — WC2026 Pronostics

**Last activity:** 2026-06-10 - Completed quick task 260610-jx7: Harden the prediction scoring engine

## What This Is

World Cup 2026 prediction-pool web app. Friends/family predict all 104 FIFA WC 2026
matches before kickoff (2026-06-11); admins enter real results to trigger automatic
scoring and a live leaderboard.

## Stack

Next.js 14 (App Router) + TypeScript · Prisma ORM + SQLite · NextAuth (Credentials) ·
TailwindCSS · Vitest (`tests/`, incl. `tests/security`).

## Current State

- **Live** at https://wc2026.sabeti.com — group-stage scoring is correct, idempotent, deployed.
- Knockout bracket data/placeholders/feeders fixed + verified + deployed to production DB
  (see `.planning/debug/knockout-bracket-not-populating.md`, HEAD-ish commit `8bbea89`).
- Codebase mapped: see `.planning/codebase/` (ARCHITECTURE, CONCERNS, STACK, STRUCTURE, TESTING, etc.).

## Key Files (scoring domain)

- `app/api/admin/matches/result/route.ts` — single-match result entry + scoring (has byte-identical dup).
- `app/api/admin/matches/bulk-result/route.ts` — bulk result entry + scoring (byte-identical dup of above).
- `lib/tournament.ts` — `advanceKnockoutWinner()`, `updateKnockoutBracket()`, standings.
- `prisma/schema.prisma` — `Prediction` (predictedHome/Away, predictedWinner), `Match` (isBonusMatch, stage).

## Confirmed Scoring Rules (source of truth)

- **Group:** exact score = 3 pts; correct result (home/away/draw) = 1 pt.
- **Knockout:** same as group, PLUS +1 if user's predicted winner = actual winner (perfect = 4).
- **Bonus matches (`isBonusMatch`):** NO scoring effect, BY DESIGN — flag marks matches for
  off-platform prizes only. Do not add bonus points; do not remove the admin toggle.

## Blockers/Concerns

See `.planning/codebase/CONCERNS.md`. Scoring duplication across the two result endpoints
is now RESOLVED (single source of truth in `lib/scoring.ts`); bonus-match scoring ambiguity
RESOLVED as by-design (documented in `lib/scoring.ts`).

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 260610-jx7 | Harden the prediction scoring engine (extract lib/scoring.ts pure fn, fix knockout winner-bonus, wrap result-entry in prisma.$transaction, add scoring tests) | 2026-06-10 | 5aa2a80 | Verified | [260610-jx7-harden-the-prediction-scoring-engine-ext](./quick/260610-jx7-harden-the-prediction-scoring-engine-ext/) |
