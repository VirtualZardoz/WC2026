import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminMatchesClient from './AdminMatchesClient';

async function getMatches() {
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { matchNumber: 'asc' },
  });
  return matches;
}

async function getTeams() {
  return await prisma.team.findMany({
    orderBy: { name: 'asc' },
  });
}

export default async function AdminMatchesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  const [matches, teams] = await Promise.all([getMatches(), getTeams()]);

  return <AdminMatchesClient matches={matches} teams={teams} />;
}

