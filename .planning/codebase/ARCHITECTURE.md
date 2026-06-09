# Architecture

**Analysis Date:** 2026-06-09

## Pattern Overview

**Overall:** Next.js 14 App Router with layered MVC-like pattern combining Server Components for data fetching, Client Components for interactivity, and API routes for backend logic.

**Key Characteristics:**
- Server-side session management via NextAuth.js (JWT strategy)
- Role-based authorization enforced at middleware and API layers
- Real-time tournament state with Prisma ORM as single source of truth
- Progressive disclosure of tournament stages (group → knockout)
- Reactive admin controls that cascade tournament state changes

## Layers

**Presentation (Client):**
- Purpose: Render UI, handle user interactions, display data
- Location: `app/(main)/*/page.tsx` (Server Components), `components/*.tsx` (Client Components)
- Contains: React components, pages, layouts, client-side providers
- Depends on: API routes, lib utilities, NextAuth session
- Used by: Browser/users

**Routing & API Gateway:**
- Purpose: Handle HTTP requests, enforce authorization, route to business logic
- Location: `app/api/` route handlers, `middleware.ts`
- Contains: API endpoint handlers (`route.ts` files), request validation, auth checks
- Depends on: Database, business logic utilities
- Used by: Client pages, external systems

**Business Logic:**
- Purpose: Tournament mechanics, scoring, predictions, standings calculations
- Location: `lib/tournament.ts`, `lib/predictedStandings.ts`, `lib/rate-limit.ts`, `lib/auth.ts`
- Contains: Pure functions for tournament state management, point calculation, knockout bracket logic
- Depends on: Prisma client
- Used by: API routes, server components

**Data Access:**
- Purpose: Abstraction over SQLite database
- Location: `lib/prisma.ts` (client singleton), `prisma/schema.prisma` (schema)
- Contains: Prisma schema definitions, database initialization
- Depends on: SQLite file
- Used by: All layers via import

**Security & Cross-Cutting:**
- Purpose: Authentication, rate limiting, validation, password hashing
- Location: `lib/auth.ts`, `lib/rate-limit.ts`, `lib/password-validation.ts`, `middleware.ts`, `next.config.js`
- Contains: NextAuth configuration, brute-force protection, input validation, security headers
- Depends on: bcryptjs, NextAuth.js
- Used by: All layers

## Data Flow

**User Registration Flow:**

1. User fills form on `app/register/page.tsx` (client-side validation)
2. Form POST to `app/api/register/route.ts`
3. API validates password strength (`lib/password-validation.ts`)
4. API creates User record via Prisma, hashes password with bcryptjs
5. Redirect to login on success

**Authentication & Session Flow:**

1. User submits credentials on `app/login/page.tsx`
2. POST to NextAuth callback at `app/api/auth/[...nextauth]/route.ts`
3. `lib/auth.ts` (authOptions) validates rate limits (`lib/rate-limit.ts`)
4. Prisma finds user, bcryptjs compares password
5. On success: JWT token created with user id + role
6. Session available via `getServerSession(authOptions)` in Server Components and API routes

**Prediction Submission Flow:**

1. User selects scores in `app/(main)/predictions/PredictionsClient.tsx` (client)
2. Client calls `POST /api/predictions` with matchId, scores
3. `app/api/predictions/route.ts` validates:
   - User authenticated
   - Scores in valid range (0-99)
   - Prediction deadline not passed (checks Tournament.predictionDeadline)
4. Prisma upserts Prediction record (userId + matchId unique)
5. Returns prediction object to client for optimistic update

**Admin Match Result Entry Flow:**

1. Admin enters score on `app/(main)/admin/matches/AdminMatchesClient.tsx`
2. Client calls `POST /api/admin/matches/result` with matchId, homeScore, awayScore
3. `app/api/admin/matches/result/route.ts` checks admin role
4. Updates Match.realScoreHome/realScoreAway in Prisma
5. Triggers tournament state cascades:
   - If group stage: calls `lib/tournament.ts` → `updateKnockoutBracket()` to populate R32 slots
   - If knockout: calls `advanceKnockoutWinner()` to populate next round
6. Calculates points for all predictions on that match
7. Updates each Prediction.pointsEarned via Prisma

**State Calculated Properties:**

- Prediction.pointsEarned: Computed on result entry, not real-time
- User leaderboard score: Aggregated from all predictions on GET `/api/` or server-side query
- Group standings (predicted): Recalculated client-side in `lib/predictedStandings.ts` from user's predictions
- Tournament knockout bracket: Populated dynamically from group results in real-time

## Key Abstractions

**Tournament Lifecycle:**
- Purpose: Encapsulate all tournament state transitions and cascading updates
- Examples: `lib/tournament.ts` (`calculateGroupStandings`, `updateKnockoutBracket`, `advanceKnockoutWinner`)
- Pattern: Async functions that query matches, compute state, then batch-update Prisma

**Prediction Record:**
- Purpose: Atomic user forecast for one match
- Pattern: userId + matchId composite unique constraint ensures single prediction per user per match
- Mutable: Can be updated until deadline (upsert pattern in API)

**Session-Enhanced User:**
- Purpose: Extend NextAuth session with app-specific fields (id, role)
- Pattern: JWT callbacks in `lib/auth.ts` attach id and role to token, then to session
- Scope: Available in Server Components via `getServerSession()`, not in client-side code

**Feature Flags:**
- Purpose: Runtime toggles for tournament settings (signup, deadlines, bonus matches)
- Location: `lib/feature-flags.ts`, `SystemSetting` model
- Pattern: Check `SystemSetting.key` before allowing feature action

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page load
- Responsibilities: Set metadata, load root providers (ThemeProvider, SessionProvider, InactivityMonitor), render global styles

**Home Page:**
- Location: `app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Check session, redirect authenticated users → `/predictions`, unauthenticated → `/login`

**Auth Route:**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Triggers: POST to `/api/auth/callback/credentials` or GET to `/api/auth/session`
- Responsibilities: Delegate to NextAuth, which uses `lib/auth.ts` authOptions

**Predictions Page:**
- Location: `app/(main)/predictions/page.tsx`
- Triggers: Authenticated user navigates to `/predictions`
- Responsibilities: Server-side fetch all matches + user predictions, pass to `PredictionsClient.tsx`, render by stage/group

**Admin Matches:**
- Location: `app/(main)/admin/matches/page.tsx` + `AdminMatchesClient.tsx`
- Triggers: Admin user navigates to `/admin/matches`
- Responsibilities: Server-fetch all matches, admin renders table for result entry, each row calls `POST /api/admin/matches/result`

**Leaderboard:**
- Location: `app/(main)/leaderboard/page.tsx` + `LeaderboardClient.tsx`
- Triggers: User navigates to `/leaderboard`
- Responsibilities: Aggregate all user total scores, rank by points, show individual user detail on click

## Error Handling

**Strategy:** Explicit NextResponse error codes + console.error logging

**Patterns:**
- **401 Unauthorized:** Missing session or invalid credentials
- **403 Forbidden:** Session exists but user lacks required role (admin)
- **404 Not Found:** Match or user resource doesn't exist
- **400 Bad Request:** Validation failure (score range, missing matchId, etc.)
- **500 Internal Error:** Unhandled exception (catch block logs, returns generic message)

**Rate Limiting:** In-memory map (`lib/rate-limit.ts`) with lockout after N attempts, not database-backed

## Cross-Cutting Concerns

**Logging:** `console.error()` for failures in API routes and server components; no structured logging framework

**Validation:** Input validation at API route layer (score ranges, unique email, password strength), not at component layer

**Authentication:** NextAuth.js JWT strategy with custom credentials provider; session tied to user.id and user.role

**Authorization:** Middleware intercepts unauthenticated requests to protected routes, role checks in API handlers

**Serialization:** Server components serialize dates to ISO strings before passing to client (e.g., `matchDate?.toISOString()`)

**Transaction Management:** No explicit transaction handling; Prisma operations are atomic within a single call, but cascading updates (result → knockout bracket → points) are sequential

---

*Architecture analysis: 2026-06-09*
