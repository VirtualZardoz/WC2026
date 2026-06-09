# External Integrations

**Analysis Date:** 2026-06-09

## APIs & External Services

**None detected** - This is a self-contained application. All functionality is built using internal services and database queries. No third-party API integrations (Stripe, Twilio, external webhooks, etc.) are present.

**Internal APIs:**
- RESTful endpoints via Next.js App Router (see `app/api/` directory)
- Client-side fetch calls to internal endpoints only
- Examples: `/api/admin/matches/result`, `/api/predictions`, `/api/register`

## Data Storage

**Database:**
- Type/Provider: SQLite
  - Schema: `prisma/schema.prisma`
  - Tables: User, Team, Match, Prediction, Tournament, SystemSetting
  - Connection: `DATABASE_URL` environment variable
  - Default path: `file:./dev.db` (development), `file:./data/production.db` (production)
  - Client: Prisma ORM (`@prisma/client@5.22.0`)

**Database Models:**
- `User` - User accounts with bcrypt password hashing
- `Team` - 48 FIFA World Cup 2026 teams
- `Match` - 104 matches (48 group + 56 knockout)
- `Prediction` - User predictions per match with scoring
- `Tournament` - Tournament metadata and prediction deadline
- `SystemSetting` - Feature flags and system configuration

**File Storage:**
- Local filesystem only - SQLite `.db` files in project directory
- No cloud storage (S3, Azure Blob, etc.)
- Artifacts: `cookies.txt` present in root (test artifact, not a runtime dependency)

**Caching:**
- In-memory rate limiting (see `lib/rate-limit.ts`)
- No Redis, Memcached, or external cache service
- Rate limit store: JavaScript Map in `lib/rate-limit.ts` lines 12
- Config: 5 attempts per 15-minute window with 15-minute lockout

## Authentication & Identity

**Auth Provider:**
- Custom NextAuth.js with Credentials provider (not OAuth)
  - Implementation: `lib/auth.ts` and `app/api/auth/[...nextauth]/route.ts`
  - Strategy: JWT session tokens
  - Session duration: 24 hours with hourly refresh (line 62 in `lib/auth.ts`)
  - Password storage: bcryptjs hash (no plaintext)

**Auth Configuration:**
- Provider: NextAuth.js Credentials
- Sign-in endpoint: `/login` (configured in `lib/auth.ts` line 82)
- Auth callback: `[...nextauth]` dynamic route
- JWT secret: `NEXTAUTH_SECRET` environment variable
- Public URL: `NEXTAUTH_URL` environment variable

**User Roles:**
- `admin` - Can view/edit matches, manage users, change settings
- `user` - Can make predictions (default)
- Role stored in JWT token (see `lib/auth.ts` lines 66-76)

**Password Policy:**
- Validation rules in `lib/password-validation.ts`
- No external password management service
- Reset capability via admin (`app/api/admin/users/reset-password/route.ts`)

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, DataDog, or error service integration

**Logs:**
- `console.error()` and `console.log()` only
- Example: `lib/rate-limit.ts` line 20 (periodic cleanup logging)
- Stored in application stdout/stderr streams
- No external logging service (ELK, CloudWatch, etc.)

**Performance Monitoring:**
- No APM (Application Performance Monitoring) service
- Next.js build indicators enabled (see `next.config.js` lines 4-7)

## CI/CD & Deployment

**Hosting:**
- Self-hosted via Node.js and Docker
- Production: https://wc2026.sabeti.com (per `.env.production.template` line 9)
- Docker base image: `node:20-slim` (see `Dockerfile` line 6)
- Container orchestration: `docker-compose.yml` available for local/dev deployment

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, Jenkins, etc.
- Manual testing via `npm test`
- Helper scripts for data migration available:
  - `migrate-real-fixtures.js` - Load real tournament fixtures
  - `fix-knockout-matches.js` - Correct knockout bracket structure
  - `recalculate-points.js` - Recalculate user scores
  - `fill-random-results.js` - Populate test match results

**Deployment Process:**
- Container deployment via Docker Compose
- Environment variables via `.env` file on server
- Database: File-based SQLite (persisted via volume mounts)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - SQLite database file path
- `NEXTAUTH_SECRET` - JWT secret (must be strong random string in production)
- `NEXTAUTH_URL` - Public deployment URL
- `NODE_ENV` - `development` or `production`

**Example values:**
- Development: See `.env.example`
- Production: See `.env.production.template` (secrets redacted)

**Secrets location:**
- `.env` file (git-ignored, not committed)
- `.env.production.template` provides structure (secrets shown as examples)
- Production `.env` created manually on server

**Security headers (configured in `next.config.js`):**
- X-Frame-Options: SAMEORIGIN (clickjacking prevention)
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: Allows Google Fonts, flagcdn.com, unsplash.com images
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Disables camera, microphone, geolocation

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

**NextAuth Callbacks:**
- JWT callback (line 66-72 in `lib/auth.ts`): Enriches token with user role
- Session callback (line 73-79 in `lib/auth.ts`): Adds user ID and role to session object
- No external webhook calls

## Rate Limiting

**Implementation:**
- In-memory store using JavaScript Map (see `lib/rate-limit.ts`)
- Applied to login attempts only
- Configuration:
  - Max attempts: 5
  - Time window: 15 minutes
  - Lockout duration: 15 minutes

**For Production:**
- Comment in `lib/rate-limit.ts` line 4 recommends migrating to Redis or dedicated rate limiting service
- Current in-memory implementation will not work across multiple server instances

## Feature Flags & Configuration

**System Settings:**
- `SystemSetting` model in Prisma schema for boolean feature flags
- Key-value storage with unique keys
- Examples: signup enabled, bonus match settings
- Accessed via `/api/admin/settings/*` endpoints

## Third-Party Services

**None** - This application is fully self-contained:
- No cloud providers (AWS, Azure, GCP)
- No SaaS integrations (Slack, SendGrid, etc.)
- No payment processors (Stripe, PayPal)
- No analytics (Google Analytics, Mixpanel)
- No CDN (Cloudflare, CloudFront)
- No message queues (RabbitMQ, SQS)
- No SMS/Email services

---

*Integration audit: 2026-06-09*
