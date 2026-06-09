# Codebase Concerns

**Analysis Date:** 2026-06-09

## Tech Debt

**In-Memory Rate Limiting:**
- Issue: Rate limiting for login attempts is stored in-memory using `Map()` only, with a simple setInterval cleanup every 5 minutes. Does not persist across server restarts or distributed deployments. All rate-limit state is lost on app crash/redeploy.
- Files: `lib/rate-limit.ts`, `lib/auth.ts`
- Impact: Rate limiting is ineffective in production or when running multiple instances. Attackers can retry after server restart. Prevents proper horizontal scaling.
- Fix approach: Replace with Redis-backed rate limiting or database-stored tracking. Store attempt counts in `SystemSetting` or dedicated table with expiration timestamps.

**Implicit Type Assumptions:**
- Issue: Multiple files use loose typing with `{ [key: string]: any }` for complex objects (tournament standings, bracket calculations). No runtime type validation.
- Files: `lib/tournament.ts` (lines 12, 99), `lib/predictedStandings.ts`, `components/KnockoutBracket.tsx`
- Impact: Type safety lost at runtime. Silent data corruption possible if shape assumptions violated. Difficult to debug bracket/standings calculation errors.
- Fix approach: Define explicit TypeScript interfaces for all domain objects. Use Zod or similar for runtime schema validation on calculated results.

**Duplicated Standings Calculation:**
- Issue: Group standings calculation logic appears in three places with near-identical implementations: `lib/tournament.ts:calculateGroupStandings()`, `lib/predictedStandings.ts:calculatePredictedGroupStandings()`, and `PredictionsClient.tsx:calculatePredictedGroupStandings()` (lines 63-130).
- Files: `lib/tournament.ts`, `lib/predictedStandings.ts`, `app/(main)/predictions/PredictionsClient.tsx`
- Impact: Bug fixes must be replicated three times. Inconsistent behavior between admin/user views possible. High maintenance burden.
- Fix approach: Extract single canonical implementation. Share between server (lib) and client (via utils). Client version should mirror server exactly.

**Hardcoded Match Numbers:**
- Issue: Knockout bracket progression uses magic numbers (match numbers 73-104, group matches 1-72) scattered throughout code. No single source of truth for stage/match boundary definitions.
- Files: `lib/tournament.ts:advanceKnockoutWinner()` (lines 188-208), `components/KnockoutBracket.tsx` (lines 112-117), tests
- Impact: Brittle to tournament structure changes. Easy to introduce off-by-one errors. Tournament format changes require coordinated updates across 5+ files.
- Fix approach: Create `lib/tournament-constants.ts` with enum-like match ranges. Export `STAGE_OFFSETS`, `MATCH_RANGES`, phase validators. Update all code to use constants.

**Cookies.txt Committed to Repo:**
- Issue: `cookies.txt` is committed (test artifact with auth tokens). Though tokens appear test-time specific, committing any cookie file is a bad practice.
- Files: `cookies.txt`
- Impact: Creates security precedent. May contain sensitive session data in future. Makes it easy to accidentally commit real secrets.
- Fix approach: Add `cookies.txt` to `.gitignore`. Remove from repo history with `git filter-branch` or BFG.

## Known Bugs

**Bonus Match Scoring Ambiguity:**
- Symptoms: Code references `isBonusMatch` field in predictions/matches but the scoring logic for bonus matches is incomplete. `AdminSettingsClient.tsx` has UI for toggling bonus matches but scoring calculation in result endpoints doesn't differentiate bonus match scoring.
- Files: `app/api/admin/matches/result/route.ts` (lines 78-130), `app/api/admin/matches/bulk-result/route.ts` (lines 72-110)
- Trigger: Set a match as bonus match, enter result, check prediction points
- Workaround: Score calculation treats bonus and regular matches identically. Bonus flag is cosmetic only.
- Impact: Bonus match feature doesn't work as designed. Users get no bonus points or wrong bonus calculation.

**Predicted Winner Logic Inconsistency (Knockout):**
- Symptoms: When calculating points for knockout matches, predicted winner is determined by comparing `predictedHome > predictedAway` (lines 106-119 in both result routes), but users may have explicitly set `predictedWinner` field. The explicit field is only used as fallback if scores are tied.
- Files: `app/api/admin/matches/result/route.ts` (lines 105-123), `app/api/admin/matches/bulk-result/route.ts` (lines 93-110)
- Trigger: User predicts a tie (1-1) with explicit winner selection, actual result is a win (2-1 for predicted winner)
- Workaround: User must predict with score that implies their winner (e.g., 2-1 instead of 1-1)
- Impact: Explicit winner prediction field is effectively ignored in knockout scoring. Confusing UX where "selecting" a winner doesn't guarantee bonus if scores don't match.

**Third-Place Ranking Vulnerability:**
- Symptoms: When all group matches complete, best 8 third-place teams are selected and assigned to knockout third-place slots based on match order. The assignment logic (lines 154-165 in `lib/tournament.ts`) assumes `r32ThirdMatches.findIndex()` returns matches in predictable order, but `filter().sort()` on array may not be stable across JavaScript engines.
- Files: `lib/tournament.ts` (lines 145-166)
- Trigger: Run bracket resolution with variable JS engine implementations or after async operations change match ordering
- Workaround: Matches happen to be ordered correctly by matchNumber in practice
- Impact: Third-place team slots could be incorrectly assigned to wrong R32 spots, affecting user predictions unfairly.

**Admin Password Creation Validation Skip:**
- Symptoms: `/api/admin/users` POST endpoint accepts `role` parameter directly from request body without validation of enum values. While middleware checks `role !== 'admin' && role !== 'user'`, an admin could create users with invalid roles (e.g., `role: 'superadmin'`, `role: 'null'`) that would bypass database constraints.
- Files: `app/api/admin/users/route.ts` (lines 38-43), compare with `/api/register/route.ts` which validates password strength
- Trigger: Admin creates user via API with arbitrary role value
- Workaround: Database schema doesn't enforce enum, so invalid roles would be stored as strings
- Impact: Role-based access control (RBAC) escalation possible. Inconsistent validation between user signup (strict) and admin creation (loose).

**Session Token Type Casting Assumption:**
- Symptoms: In `lib/auth.ts`, session callback casts token fields without null checks: `session.user.id = token.id as string; session.user.role = token.role as string` (lines 75-76). If token missing these fields, session would have undefined values cast to string.
- Files: `lib/auth.ts` (lines 73-79)
- Trigger: Token issued without id/role (e.g., from external provider or corrupted token)
- Workaround: Currently only Credentials provider, so shouldn't happen, but fragile to future changes
- Impact: Silent corruption of session data. User object would have string type but undefined value, breaking downstream code that assumes existence.

## Security Considerations

**Missing CSRF Protection on State-Changing Operations:**
- Risk: Admin endpoints modify tournament state (`/api/admin/settings/deadline`, `/api/admin/matches/result`, etc.) accept POST requests but NextAuth CSRF tokens are not explicitly validated in request bodies. CSRF middleware should exist but not visible in routes.
- Files: `middleware.ts`, `app/api/admin/**/route.ts` (all POST endpoints)
- Current mitigation: NextAuth middleware handles CSRF automatically via cookie-based token validation
- Recommendations: Add explicit CSRF token validation in sensitive endpoints. Log CSRF rejection attempts. Consider SameSite=Strict cookie policy in auth config.

**Password Reset Flow Missing:**
- Risk: No self-service password reset. Admin can force reset via `reset_password.js` script (committed, executable), but no mechanism for users to securely reset forgotten passwords. Users depend entirely on admin help.
- Files: `reset_password.js` (committed script), `/api/auth/` (no reset endpoint)
- Current mitigation: Only admin action possible, limits scope
- Recommendations: Implement email-based password reset with time-limited tokens stored in `SystemSetting` or separate token table. Rate-limit reset requests. Send reset links via email.

**Email Address Not Validated:**
- Risk: Registration and admin user creation accept any string as email, no verification that email is real or user-controlled. Users can register with fake emails.
- Files: `app/api/register/route.ts`, `app/api/admin/users/route.ts`
- Current mitigation: Email is unique, so at least prevents account takeover via typos
- Recommendations: Implement email verification on signup. Send confirmation link before activation. Re-verify on email change.

**SQLite in Production (Scaling Risk):**
- Risk: Database is SQLite (file-based). No automatic replication, backup, or multi-instance consistency. Single point of failure.
- Files: `prisma/schema.prisma` (line 6)
- Current mitigation: Appears intentional for demo/dev. Docker setup exists.
- Recommendations: For production deployment, migrate to PostgreSQL or managed database. Implement automated backups. Set up read replicas if scaling.

**Admin Credentials Hardcoded in Session Logs:**
- Risk: Project CLAUDE.md mentions seed credentials (`admin@example.com / admin123`) that were logged in "old session logs". Credentials appear to be default/example, but committing any default credentials is a vulnerability vector.
- Files: `CLAUDE.md` (plaintext), seed data
- Current mitigation: Listed as "verify/rotate before prod use"
- Recommendations: Remove all default credentials from docs. Force password change on first admin login. Never log credentials. Use environment variables for seed defaults only in non-production.

## Performance Bottlenecks

**N+1 Queries in Admin Matches Page:**
- Problem: `AdminMatchesClient.tsx` receives all matches with relations but doesn't batch load teams. If rendering 100+ matches, each match card may trigger separate team queries.
- Files: `app/(main)/admin/matches/AdminMatchesClient.tsx`, `app/(main)/admin/matches/page.tsx`
- Cause: Component receives pre-loaded data correctly, but real issue is bulk result endpoint recalculates all predictions sequentially (line 65-116 in bulk-result/route.ts: loop with individual prediction updates).
- Improvement path: Batch prediction updates in single Prisma transaction. Use `prisma.$transaction()` with array of operations. Measure: bulk result should complete in <2s even for 2000 predictions.

**Knockout Bracket Resolution Inefficiency:**
- Problem: Every time group result is entered, `updateKnockoutBracket()` runs full calculation: fetches all matches, fetches all group standings, iterates knockout matches. On large tournaments with many results entered, this is O(n²).
- Files: `lib/tournament.ts:updateKnockoutBracket()` (lines 97-175), called from both `result/route.ts` and `bulk-result/route.ts`
- Cause: No caching of group standings. Recalculated even if unchanged groups.
- Improvement path: Cache group standings in `SystemSetting` or memory. Invalidate only when relevant group's matches change. Consider debouncing bracket updates (batch multiple result entries before recalculating).

**Full Leaderboard Recalculation:**
- Problem: Leaderboard endpoint doesn't specify limit/offset for user queries. Fetches all users + all their predictions even if displaying top 20. Client-side filtering in `LeaderboardClient.tsx` (line 100+) happens after fetch.
- Files: `app/(main)/leaderboard/page.tsx`, `app/(main)/leaderboard/LeaderboardClient.tsx` (line 58-70)
- Cause: No pagination implemented. Sorting happens client-side after full dataset loads.
- Improvement path: Implement server-side pagination and sorting. Fetch only requested page. Cache leaderboard results with 5-minute TTL in `SystemSetting` or Redis.

## Fragile Areas

**Knockout Bracket Placeholder Resolution:**
- Files: `components/KnockoutBracket.tsx` (lines 98-200+), `lib/tournament.ts` (lines 119-141)
- Why fragile: Complex regex and string parsing to resolve placeholders (e.g., "Winner A", "Runner-up B", "3rd C/D/E"). Multiple code paths for winner/loser determination. Easy to miss edge cases. Placeholders aren't validated schema.
- Safe modification: Add strict TypeScript types for placeholder strings. Use branded types: `type WinnerPlaceholder = { __brand: 'winner'; group: string }` etc. Test all placeholder combinations before deployment.
- Test coverage: `tests/features/knockout-cascade.test.ts` covers main cases, but lacks negative tests (invalid placeholders, missing qualifiers, etc).

**Prediction Scoring Logic:**
- Files: `app/api/admin/matches/result/route.ts` (lines 75-130), `app/api/admin/matches/bulk-result/route.ts` (lines 69-110)
- Why fragile: Scoring rules (3 pts exact, 1 pt result, 1 pt knockout winner) are duplicated and embedded in route handlers. No single scoring engine. Changes must sync across endpoints. Calculation happens after match update, so race conditions possible if two results entered simultaneously.
- Safe modification: Extract scoring to `lib/scoring.ts` with pure functions. Wrap entire score-result flow in database transaction. Add comprehensive scoring tests (`tests/features/scoring.test.ts`).
- Test coverage: No tests for scoring logic. Only leaderboard/knockout tests exist.

**Group Stage Result Entry Dependency Chain:**
- Files: `app/api/admin/matches/result/route.ts`, `lib/tournament.ts:advanceKnockoutWinner()`, `lib/tournament.ts:updateKnockoutBracket()`
- Why fragile: Entering a group match result triggers cascade: update match → trigger bracket updates → advance winners to next round → predict 3rd-place teams → assign to slots. Multiple async operations with no transaction. If one fails midway, state is inconsistent.
- Safe modification: Wrap entire flow in `prisma.$transaction()`. Validate all state before commit. Add idempotency keys so re-runs don't duplicate side effects. Log each cascade step for debugging.
- Test coverage: `tests/features/knockout-cascade.test.ts` has good coverage, but doesn't test rollback scenarios or partial failures.

**Admin User Role Escalation:**
- Files: `app/api/admin/users/route.ts` (POST with unchecked role), `middleware.ts` (role check)
- Why fragile: Role values not enum-constrained. Middleware checks `role !== 'admin' && role !== 'user'` but database stores whatever string admin provides. Future code might check `role.includes('admin')` and bypass checks.
- Safe modification: Create `enum UserRole { USER = 'user', ADMIN = 'admin' }` in Prisma schema. Use strict enums in TypeScript. Validate role against enum in all endpoints.
- Test coverage: No security tests for role escalation. `tests/security/` has password + rate-limit tests only.

## Scaling Limits

**SQLite Single-File Limitation:**
- Current capacity: ~10k users × 104 matches × predictions = 1M+ rows. SQLite can handle, but locking becomes problematic under concurrent writes.
- Limit: Concurrent admin result entry. SQLite locks entire database for writes. Multiple admins entering results simultaneously will block.
- Scaling path: Migrate to PostgreSQL. Use connection pooling (PgBouncer). Implement queue-based result entry with worker process handling scoring async.

**In-Memory Rate Limit Storage:**
- Current capacity: Stores attempt counts for all unique login attempts in last 15 minutes. With 1000 concurrent users, ~5000 entries. Map lookup O(1), no problem.
- Limit: Server restart clears all state. Under DDoS with distributed IPs, attacker bypasses by hitting different instances.
- Scaling path: Redis-backed store. All instances share rate limit state. Atomic increments and TTL support. Can scale to millions of blocked IPs.

**Leaderboard Calculation on Demand:**
- Current capacity: Full calculation on every leaderboard page load. ~1000 users, 104 predictions each, means 104k point calculations per page load.
- Limit: Slows as prediction count grows. At 10k users, 1M+ calculations per load.
- Scaling path: Pre-calculate leaderboard hourly. Cache results. Serve from cache with "last updated X min ago" label. Recalculate async when match results entered.

## Dependencies at Risk

**Puppeteer (Unused Dep):**
- Risk: `puppeteer` listed in `package.json` (line 21) but not imported anywhere in codebase. Adds 100MB+ to node_modules and build artifacts. Potential security surface from unmaintained browser automation.
- Impact: Slows installs and deployments. If package has vulnerability, forces update with no direct benefit.
- Migration plan: Remove unless used for E2E testing or screenshot generation. If needed, move to devDependencies only.

**bcrypt AND bcryptjs:**
- Risk: Both `bcrypt` (line 17) and `bcryptjs` (line 18) in dependencies. Only `bcryptjs` imported in code. `bcrypt` (native binding) is unnecessary.
- Impact: Bloats bundle, adds native compilation complexity, unused code.
- Migration plan: Remove `bcrypt`, keep `bcryptjs` only. Run `npm ls bcrypt` to verify it's truly unused.

**Next.js 14.2.15 (Pinned):**
- Risk: Exact version pinned. Security patches and minor updates won't auto-apply even with `^` semver.
- Impact: Misses bug fixes and security patches. Falls behind ecosystem versions.
- Mitigation: Already good practice for production stability. Just ensure regular manual updates.

## Missing Critical Features

**Email Notification System:**
- Problem: No email sent for password resets, result announcements, leaderboard changes. Users have no way to be notified of important tournament events.
- Blocks: Users can't reset passwords. No push for results. Can't share leaderboard.
- Impact: Tournament administration requires manual communication outside app. Users might miss deadline notifications.
- Recommended priority: High for production. Implement email sending with retry queue (e.g., Resend, SendGrid). Store email log in database for auditing.

**Audit Logging:**
- Problem: No audit trail of admin actions. Who changed match results? When was deadline modified? No way to investigate errors or rollback changes.
- Blocks: Compliance, debugging, fraud detection.
- Impact: Can't verify data integrity. Admins can make mistakes without recourse. Impossible to recover from accidental data corruption.
- Recommended priority: High for production. Create `AuditLog` model. Log all admin actions with timestamp, user, entity, change details. Retention: 1 year.

**Rollback/Undo for Match Results:**
- Problem: Once admin enters match result, it immediately triggers scoring and bracket updates. No undo. Mistakes in score entry cascade across all user points.
- Blocks: Admin can't correct typo without manual database intervention.
- Impact: One data entry mistake affects entire leaderboard. Unfair to users.
- Recommended priority: Medium. Add "withdraw result" endpoint that recalculates points for all predictions. Keep audit trail of withdrawn results.

## Test Coverage Gaps

**Scoring Logic (No Tests):**
- What's not tested: Exact score bonus, result prediction bonus, knockout bonus points calculation. Combinations of match types (group vs knockout vs bonus). Edge cases (draws, tied leaderboards).
- Files: `app/api/admin/matches/result/route.ts`, `app/api/admin/matches/bulk-result/route.ts`
- Risk: Scoring changes might silently break point calculation. Hard to verify fairness.
- Priority: High. Add `tests/features/scoring.test.ts` with 50+ test cases covering all point scenarios.

**Admin Authorization (Minimal Tests):**
- What's not tested: Non-admin users accessing admin endpoints. Invalid roles being accepted. User cannot self-delete but might be bypassed by ID.
- Files: `middleware.ts`, `app/api/admin/**/route.ts`
- Risk: Authorization bugs silently allow unauthorized access.
- Priority: High. Add `tests/security/authorization.test.ts` with negative test cases.

**Edge Cases in Predictions:**
- What's not tested: Submitting predictions after deadline (should be rejected). Editing prediction after result entered. Negative scores, out-of-range values.
- Files: `app/api/predictions/route.ts`
- Risk: Users might submit invalid data that breaks scoring.
- Priority: Medium. Expand `tests/features/` with prediction edge case tests.

**Bracket Placeholder Resolution (Partial):**
- What's not tested: Malformed placeholders. Missing team data. Incomplete group stage.
- Files: `components/KnockoutBracket.tsx`, `lib/tournament.ts`
- Risk: Undefined behavior if data doesn't match assumptions.
- Priority: Medium. Add negative tests to `tests/features/knockout-cascade.test.ts`.

**Admin User Management:**
- What's not tested: Creating user with invalid email. Deleting last admin. Role changes. Duplicate user prevention.
- Files: `app/api/admin/users/route.ts`, `/api/admin/users/role/route.ts`
- Risk: User data corruption, access control bypass.
- Priority: Medium. Add `tests/features/admin-users.test.ts`.

---

*Concerns audit: 2026-06-09*
