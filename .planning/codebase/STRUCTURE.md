# Codebase Structure

**Analysis Date:** 2026-06-09

## Directory Layout

```
wc2026/
├── app/                        # Next.js App Router (main entry point)
│   ├── (main)/                 # Route group for authenticated pages (layout + sidebar)
│   │   ├── admin/              # Admin panel routes
│   │   │   ├── matches/        # Match result entry interface
│   │   │   ├── settings/       # Tournament settings (deadline, signup toggle, etc.)
│   │   │   ├── users/          # User management (role assignment, password reset)
│   │   │   └── page.tsx        # Admin dashboard home
│   │   ├── leaderboard/        # Live leaderboard pages
│   │   ├── predictions/        # User predictions interface (group + knockout)
│   │   ├── profile/            # User profile + password change
│   │   ├── results/            # Live match results display
│   │   └── layout.tsx          # Authenticated layout (sidebar + nav)
│   ├── api/                    # Next.js API routes (backend)
│   │   ├── admin/              # Admin-only endpoints
│   │   ├── auth/               # NextAuth.js authentication
│   │   ├── predictions/        # Prediction CRUD
│   │   ├── profile/            # User profile updates
│   │   └── register/           # User registration
│   ├── login/                  # Login page (public)
│   ├── register/               # Registration page (public)
│   ├── layout.tsx              # Root layout (providers, styles)
│   ├── page.tsx                # Home page (redirects based on auth)
│   ├── providers.tsx           # Client providers (SessionProvider, ThemeProvider)
│   └── globals.css             # Global Tailwind + custom styles
├── components/                 # Reusable React components
│   ├── AuthHeader.tsx          # User session/logout header
│   ├── InactivityMonitor.tsx   # Auto-logout on inactivity
│   ├── KnockoutBracket.tsx     # R32/QF/SF/Final bracket visualization
│   ├── MatchCard.tsx           # Prediction/result card for single match
│   ├── Navbar.tsx              # Mobile-responsive navbar
│   ├── Sidebar.tsx             # Desktop sidebar navigation
│   └── ThemeProvider.tsx       # Dark/light mode context
├── lib/                        # Utility functions and business logic
│   ├── auth.ts                 # NextAuth configuration + custom types
│   ├── countries.ts            # Team data (codes, flags, groups)
│   ├── feature-flags.ts        # Runtime toggles for features
│   ├── password-validation.ts  # Password strength rules
│   ├── predictedStandings.ts   # Calculate user's predicted group standings
│   ├── prisma.ts               # Prisma client singleton
│   ├── rate-limit.ts           # In-memory brute-force protection
│   └── tournament.ts           # Tournament state logic (standings, bracket, knockout cascade)
├── prisma/                     # Database schema and seed
│   ├── schema.prisma           # Prisma data model (User, Team, Match, Prediction, etc.)
│   └── seed.ts                 # Database seeding script (teams + matches)
├── tests/                      # Test suite
│   ├── features/               # Feature integration tests
│   │   ├── bonus-matches.test.ts
│   │   ├── knockout-cascade.test.ts
│   │   ├── leaderboard.test.ts
│   │   └── signup-toggle.test.ts
│   ├── integration/            # Integration tests
│   │   └── signup-toggle.integration.test.ts
│   └── security/               # Security tests
│       ├── password-validation.test.ts
│       ├── rate-limit.test.ts
│       └── security-headers.test.ts
├── middleware.ts               # NextAuth middleware (auth + role checks)
├── next.config.js              # Next.js configuration (security headers, CSP)
├── tsconfig.json               # TypeScript configuration (@ alias)
├── vitest.config.ts            # Vitest test runner configuration
├── package.json                # Dependencies + scripts
└── prisma/
    ├── schema.prisma           # Data model
    └── seed.ts                 # Seed script (teams + matches)
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router entry point; contains all pages, layouts, and API routes
- Contains: Server components (pages), Client components, API handlers, middleware
- Key files: `layout.tsx`, `providers.tsx`, `globals.css`

**app/(main)/:**
- Purpose: Route group for authenticated pages; shares common layout (sidebar, nav, footer)
- Contains: Prediction, leaderboard, admin, profile, results pages
- Key files: `layout.tsx` (wraps with Sidebar), each subdirectory is a route

**app/api/:**
- Purpose: API route handlers (Next.js server-side functions)
- Contains: Handler functions (GET/POST/PUT/DELETE) that implement business logic
- Key files: Nested routes mirror frontend structure (e.g., `api/admin/matches/result/route.ts`)

**components/:**
- Purpose: Reusable React components used across pages
- Contains: Client-side UI (buttons, cards, forms, modals), context providers
- Key files: `Sidebar.tsx`, `MatchCard.tsx`, `KnockoutBracket.tsx` (largest components)

**lib/:**
- Purpose: Utility functions and business logic (not React-specific)
- Contains: Pure functions, singleton instances (Prisma), configuration objects
- Key files: `auth.ts` (NextAuth + types), `tournament.ts` (core logic), `prisma.ts` (database client)

**prisma/:**
- Purpose: Database schema and tooling
- Contains: Prisma schema definition, seed script
- Key files: `schema.prisma` (7 models: User, Team, Match, Prediction, Tournament, SystemSetting), `seed.ts`

**tests/:**
- Purpose: Test suite (unit, integration, security)
- Contains: Test files organized by category (features, integration, security)
- Key files: Each `.test.ts` file corresponds to a feature or component

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root React tree layout; loads Providers, styles, metadata
- `app/page.tsx`: Home redirect logic (auth → `/predictions`, no auth → `/login`)
- `app/api/auth/[...nextauth]/route.ts`: NextAuth.js OAuth/callback endpoint
- `middleware.ts`: Enforce auth on protected routes, role checks for admin routes

**Configuration:**
- `next.config.js`: Security headers (CSP, X-Frame-Options, etc.), dev indicators
- `tsconfig.json`: TypeScript strict mode, path alias `@/*` → root
- `vitest.config.ts`: Test environment (node), include pattern `tests/**/*.test.ts`
- `.env`: Database URL, NEXTAUTH_SECRET (not committed, copy from `.env.example`)

**Core Logic:**
- `lib/auth.ts`: NextAuth configuration, JWT callbacks, custom session types
- `lib/tournament.ts`: `calculateGroupStandings()`, `updateKnockoutBracket()`, `advanceKnockoutWinner()`
- `lib/prisma.ts`: Prisma client singleton (prevent multiple instances in dev)
- `lib/rate-limit.ts`: In-memory login attempt tracking
- `prisma/schema.prisma`: Data model for all entities

**Testing:**
- `tests/features/*.test.ts`: Feature-level tests (bonus matches, knockout logic, leaderboard)
- `tests/security/*.test.ts`: Security validation (password strength, rate limiting, headers)
- `vitest.config.ts`: Test runner configuration

**Database:**
- `prisma/schema.prisma`: 7 models (User, Team, Match, Prediction, Tournament, SystemSetting)
- `prisma/seed.ts`: Populate initial teams (48) and matches (104)
- `.env` DATABASE_URL: Points to SQLite file (typically `prisma/dev.db`)

**Public Routes (no auth required):**
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/api/register/route.ts`
- `app/api/auth/[...nextauth]/route.ts`

**Protected Routes (auth required):**
- All routes under `app/(main)/`
- All routes under `app/api/predictions`, `app/api/profile`

**Admin-Only Routes:**
- `app/(main)/admin/*`
- `app/api/admin/*`

## Naming Conventions

**Files:**
- Server components: `[name]/page.tsx` (e.g., `predictions/page.tsx`)
- Client components: `[Name]Client.tsx` (e.g., `PredictionsClient.tsx`)
- Reusable components: `[Name].tsx` (e.g., `MatchCard.tsx`)
- API routes: `route.ts` (HTTP handler at that path)
- Tests: `[feature].test.ts` or `[feature].integration.test.ts`
- Utilities: camelCase (e.g., `predictedStandings.ts`, `rate-limit.ts`)

**Directories:**
- Feature directories: kebab-case (e.g., `admin/matches`, `api/admin/users`)
- Component directories: PascalCase when needed (none currently; components are flat)
- Route groups (Next.js): Parentheses `(main)`, `(auth)` (only one: `(main)`)

**Functions & Variables:**
- Functions: camelCase (e.g., `calculateGroupStandings()`, `checkRateLimit()`)
- Constants: UPPER_SNAKE_CASE (seen in tests and config)
- Types/Interfaces: PascalCase (e.g., `Session`, `Match`, `Prediction`)
- React components: PascalCase (e.g., `MatchCard`, `AdminMatchesClient`)

## Where to Add New Code

**New Feature (e.g., new page like "Hall of Fame"):**
- Create server component: `app/(main)/hall-of-fame/page.tsx`
- Add navigation link in `components/Sidebar.tsx` and `components/Navbar.tsx`
- Create API endpoint if needed: `app/api/hall-of-fame/route.ts`
- Add tests: `tests/features/hall-of-fame.test.ts`

**New Component/Module:**
- If reusable UI: `components/[Name].tsx`
- If business logic: `lib/[utility-name].ts`
- If database-related: Extend `prisma/schema.prisma` and run `npx prisma migrate`

**New Admin Feature:**
- Server component: `app/(main)/admin/[feature]/page.tsx`
- Client component: `app/(main)/admin/[feature]/[Feature]Client.tsx`
- API route: `app/api/admin/[feature]/route.ts`
- Middleware already protects `/admin/*` and `/api/admin/*` routes

**Utilities & Helpers:**
- Authentication-related: `lib/auth.ts` or create `lib/auth/[feature].ts`
- Tournament logic: Extend `lib/tournament.ts` or create `lib/tournament/[feature].ts`
- Validation: Create `lib/validators/[name].ts` (no validators directory yet; add as needed)

**Tests:**
- Unit tests for utils: `tests/[feature].test.ts`
- Integration tests: `tests/integration/[feature].integration.test.ts`
- Security tests: `tests/security/[concern].test.ts`

## Special Directories

**app/api/**
- Purpose: Next.js API routes (server-side HTTP handlers)
- Generated: No
- Committed: Yes
- Pattern: `route.ts` exports GET/POST/PUT/DELETE functions

**app/(main)/**
- Purpose: Route group for authenticated pages (share layout)
- Generated: No
- Committed: Yes
- Pattern: Each subdirectory is a route, `page.tsx` is the page, `layout.tsx` wraps children

**.next/**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No (in `.gitignore`)
- Contents: Compiled JavaScript, .map files, server functions

**prisma/**
- Purpose: Database schema and migrations
- Generated: Partially (generated client in `node_modules/.prisma`)
- Committed: Yes (schema.prisma, seed.ts)
- Migrations: None committed yet; first migration created on `npx prisma migrate dev`

**stitch_design/**
- Purpose: Design mockups (Figma exports or Stitch design artifacts)
- Generated: Yes
- Committed: Yes (reference designs)
- Note: Not used in runtime; for reference only

**docs/**
- Purpose: Documentation (tournament rules, API specs, etc.)
- Generated: No
- Committed: Yes
- Files: `knockout-bracket-spec.md`, feature list, etc.

---

*Structure analysis: 2026-06-09*
