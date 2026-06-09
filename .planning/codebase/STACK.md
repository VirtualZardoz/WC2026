# Technology Stack

**Analysis Date:** 2026-06-09

## Languages

**Primary:**
- TypeScript 5.6.3 - Full codebase type safety for web app and Node.js
- JavaScript - Configuration files and scripts

**Secondary:**
- SQL - Prisma ORM query language for SQLite operations

## Runtime

**Environment:**
- Node.js 20 (specified in `Dockerfile` line 6: `node:20-slim`)

**Package Manager:**
- npm - Specified in `package.json`
- Lockfile: `package-lock.json` (standard npm lockfile pattern)

## Frameworks

**Core:**
- Next.js 14.2.15 - Full-stack React framework with App Router (`package.json` line 19)
- React 18.3.1 - UI library (`package.json` line 22)
- React DOM 18.3.1 - DOM rendering (`package.json` line 23)

**Authentication:**
- NextAuth.js 4.24.8 - Session and credential-based auth (`package.json` line 20)
  - Credentials provider for email/password login (see `lib/auth.ts` lines 8-58)
  - JWT session strategy with 24-hour max age (see `lib/auth.ts` lines 60-64)

**Styling:**
- TailwindCSS 3.4.14 - Utility-first CSS framework (`package.json` line 35)
- PostCSS 8.4.47 - CSS processing (`package.json` line 33)
- Autoprefixer 10.4.20 - Vendor prefix support (`package.json` line 30)

**Database & ORM:**
- Prisma 5.22.0 - TypeScript ORM for SQLite (`package.json` lines 16 and 34)
  - Database generation on postinstall (`package.json` line 13)
  - Seed configuration (`package.json` lines 40-42)
  - Schema location: `prisma/schema.prisma`

**Testing:**
- Vitest 3.2.4 - Unit and integration test framework (`package.json` line 38)
  - Configuration: `vitest.config.ts`
  - Test discovery: `tests/**/*.test.ts` pattern
  - Environment: Node.js environment for backend tests

**Build & Dev Tools:**
- ESLint 8.57.1 - Code linting (`package.json` line 31)
  - Config: `.eslintrc.json` (extends `next/core-web-vitals`)
- TypeScript 5.6.3 - Type checking (`package.json` line 37)
- ts-node 10.9.2 - Direct TypeScript execution for seed scripts (`package.json` line 36)

**Security:**
- bcryptjs 2.4.3 - Password hashing for authentication (`package.json` line 18)
  - Types: `@types/bcryptjs@2.4.6`
- bcrypt 6.0.0 - Alternative bcrypt library (`package.json` line 17)

**Utilities:**
- Puppeteer 24.33.1 - Browser automation for testing/scraping (`package.json` line 21)

## Key Dependencies

**Critical:**
- `@prisma/client@5.22.0` - ORM client for SQLite database operations
- `next@14.2.15` - Web framework with API routes and SSR
- `next-auth@4.24.8` - Authentication middleware and session management
- `bcryptjs@2.4.3` - Secure password hashing for user credentials

**Infrastructure:**
- `react@18.3.1` - React library for components
- `tailwindcss@3.4.14` - CSS framework for styling

## Configuration Files

**Runtime:**
- `tsconfig.json` - TypeScript compiler configuration
  - Path alias: `@/*` maps to project root (line 26-28)
  - Strict mode enabled
  - ESNext module resolution
  - Next.js plugin enabled (line 22)

**Build:**
- `next.config.js` - Next.js configuration
  - Build directory: `.next` (line 2)
  - React strict mode enabled (line 4)
  - Security headers configured (lines 11-64):
    - X-Frame-Options: SAMEORIGIN (clickjacking protection)
    - X-Content-Type-Options: nosniff (MIME sniffing prevention)
    - Content-Security-Policy with Google Fonts support (lines 49-59)
    - Permissions-Policy disabling camera, microphone, geolocation

**Linting:**
- `.eslintrc.json` - ESLint configuration (extends Next.js core web vitals)

**Testing:**
- `vitest.config.ts` - Vitest configuration
  - Node.js environment (line 7)
  - Global test utilities enabled (line 6)
  - Coverage reporters: text, json, html (lines 9-11)
  - Path alias support matching TypeScript (lines 13-16)

## Environment Configuration

**Required env vars (see `.env.example`):**
- `DATABASE_URL` - SQLite database file path (default: `file:./dev.db`)
- `NEXTAUTH_SECRET` - Secret key for JWT signing and encryption
- `NEXTAUTH_URL` - Public URL for NextAuth callbacks (local dev: `http://localhost:3000`, production: `https://wc2026.sabeti.com`)
- `NODE_ENV` - Execution environment (`development` or `production`)

**Production template:**
- See `.env.production.template` for production example configuration

**Secrets location:**
- Environment variables via `.env` file (not committed; see `.gitignore`)
- NEXTAUTH_SECRET should be rotated in production

## Platform Requirements

**Development:**
- Node.js 20.x LTS
- npm package manager
- SQLite (included via Prisma)
- Minimum 512MB memory (docker-compose limit: 2G)
- ~2 CPU cores available

**Production:**
- Node.js 20.x
- Database file path writable (SQLite file path at `data/production.db` per template)
- NEXTAUTH_URL must match deployment domain
- NEXTAUTH_SECRET must be secure random string

**Deployment Target:**
- Containerized via Docker (see `Dockerfile` with node:20-slim base)
- Docker Compose orchestration available (`docker-compose.yml`)
- Runs as non-root user `hal9000` for security

## Build Commands

**Development:**
```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

**Testing:**
```bash
npm test             # Run Vitest (all tests)
npm run test:watch   # Watch mode
npm run test:security # Security-specific tests
```

**Database:**
```bash
npm install          # Runs postinstall script to generate Prisma client
```

---

*Stack analysis: 2026-06-09*
