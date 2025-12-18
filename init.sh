#!/bin/bash

# World Cup Pronostics 2026 - Development Environment Setup
# This script initializes and runs the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  World Cup Pronostics 2026 - Setup Script      ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18 or higher required (found v$(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

echo ""
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Setup Prisma and database
echo -e "${YELLOW}Setting up database...${NC}"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (if seed script exists)
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    echo -e "${YELLOW}Seeding database with initial data...${NC}"
    npx prisma db seed
fi

echo ""
echo -e "${GREEN}✓ Database setup complete${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Setup Complete!                               ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "To start the development server, run:"
echo -e "  ${GREEN}npm run dev${NC}"
echo ""
echo -e "The application will be available at:"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Default Admin Credentials:${NC}"
echo -e "  Email:    ${GREEN}admin@example.com${NC}"
echo -e "  Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${YELLOW}Available Routes:${NC}"
echo "  /              - Home (redirects based on auth status)"
echo "  /login         - User login"
echo "  /register      - User registration"
echo "  /predictions   - Submit/edit predictions"
echo "  /leaderboard   - View rankings"
echo "  /results       - Match results"
echo "  /profile       - User profile"
echo "  /admin         - Admin dashboard (admin only)"
echo "  /admin/matches - Enter match results (admin only)"
echo "  /admin/users   - User management (admin only)"
echo "  /admin/settings - Tournament settings (admin only)"
echo ""
echo -e "${BLUE}================================================${NC}"
