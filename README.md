# World Cup Pronostics 2026

A Next.js web application for organizing a football prediction competition among friends and family for the FIFA World Cup 2026. Participants submit predictions for all 104 matches before the tournament begins, and admins manually enter real results to trigger automatic scoring and dynamic leaderboard updates.

## Features

- **User Authentication**: Email/password registration and login with secure session management
- **Pre-populated Tournament**: Complete 2026 FIFA World Cup structure with 48 teams, 12 groups, and 104 matches
- **Prediction System**: Submit predictions for all matches before the tournament deadline
- **Automatic Scoring**: Points calculated instantly when results are entered
- **Auto-progression**: Knockout bracket teams auto-populate based on group results
- **Leaderboard**: Real-time rankings with filtering and sorting options
- **Admin Interface**: Enter results, manage users, set deadlines, and configure bonus matches

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with Credentials provider
- **Styling**: TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Quick Setup

Run the initialization script:

```bash
./init.sh
```

This will:
1. Install all dependencies
2. Set up the database
3. Create the `.env` file
4. Seed initial data (48 teams, 104 matches, admin user)

### Manual Setup

If you prefer to set up manually:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Credentials

After seeding, an admin account is created:

- **Email**: admin@example.com
- **Password**: admin123

**Important**: Change these credentials in production!

## Application Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Home (redirects based on auth) | Public |
| `/login` | Login page | Public |
| `/register` | Registration page | Public |
| `/predictions` | Submit predictions | Authenticated |
| `/predictions/[stage]` | Filtered predictions | Authenticated |
| `/leaderboard` | View rankings | Public |
| `/results` | Match results | Public |
| `/profile` | User profile | Authenticated |
| `/admin` | Admin dashboard | Admin only |
| `/admin/matches` | Enter/edit results | Admin only |
| `/admin/users` | User management | Admin only |
| `/admin/settings` | Tournament settings | Admin only |

## Scoring System

### Group Stage (48 matches)
- **3 points**: Exact score match
- **1 point**: Correct result (win/draw/loss) but wrong score

### Knockout Stage (56 matches)
- **3 points**: Exact score match
- **1 point**: Correct result but wrong score
- **1 point (bonus)**: Correctly predicted qualifying team

### Bonus Matches
- Admin can designate 3-5 matches as "bonus matches"
- Special tracking for users who get all bonus matches correct

## Tournament Structure

- **Group Stage**: 12 groups (A-L), 4 teams each, 6 matches per group (48 total)
- **Round of 32**: 16 matches (top 2 from each group + 8 best third-placed)
- **Round of 16**: 8 matches
- **Quarter-finals**: 4 matches
- **Semi-finals**: 2 matches
- **Third-place playoff**: 1 match
- **Final**: 1 match

**Total**: 104 matches

## Project Structure

```
world-cup-pronostics/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related pages
│   ├── admin/             # Admin pages
│   ├── api/               # API routes
│   ├── leaderboard/       # Leaderboard page
│   ├── predictions/       # Predictions pages
│   ├── profile/           # User profile
│   └── results/           # Results page
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/               # Database schema and seeds
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Database seeding
├── public/               # Static assets
└── styles/               # Global styles
```

## Development

### Database Commands

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset && npx prisma db seed

# Generate Prisma client after schema changes
npx prisma generate
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Session encryption key | (generated) |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |

## Contributing

This is a personal/family project. Feel free to fork and adapt for your own prediction competitions!

## License

MIT
