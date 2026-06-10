# Project State — WC2026 Pronostics

**Last activity:** 2026-06-10 - Deployed quick task 260610-jx7 (scoring hardening) to prod; app FROZEN for launch

> **🔒 FROZEN FOR LAUNCH (2026-06-10):** No further code changes while users predict
> (Alexandre's directive). Kickoff 2026-06-11. Treat remaining scoring/UX-polish items as
> post-launch backlog, not pending work.

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
  (see `.planning/debug/knockout-bracket-not-populating.md`, commit `8bbea89`).
- **Scoring engine hardened + deployed** (quick task 260610-jx7): single source of truth in
  `lib/scoring.ts`, both result endpoints transactional, knockout winner-bonus fixed. Built from
  `b82783d`, shipped as prod build `EvA-AMSoi2IsORxHDQ-qj`, verified live. Commits `292cc1b →
  b82783d` pushed to origin/main (origin was `8bbea89`, now `b82783d`).
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
| 260610-jx7 | Harden the prediction scoring engine (extract lib/scoring.ts pure fn, fix knockout winner-bonus, wrap result-entry in prisma.$transaction, add scoring tests) | 2026-06-10 | b82783d | Verified + Deployed (prod build `EvA-AMSoi2IsORxHDQ-qj`, pushed origin/main) | [260610-jx7-harden-the-prediction-scoring-engine-ext](./quick/260610-jx7-harden-the-prediction-scoring-engine-ext/) |
