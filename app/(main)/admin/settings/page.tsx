import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isRegistrationEnabled } from '@/lib/feature-flags';
import AdminSettingsClient from './AdminSettingsClient';

async function getSettings() {
  const signupEnabled = await isRegistrationEnabled();
  const tournament = await prisma.tournament.findFirst({
    where: { isActive: true },
  });

  const teams = await prisma.team.findMany({
    orderBy: [{ group: 'asc' }, { name: 'asc' }],
  });

  const matches = await prisma.match.findMany({
    where: { stage: 'group' },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { matchNumber: 'asc' },
  });

  const bonusMatches = matches.filter((m) => m.isBonusMatch);

  return {
    signupEnabled,
    tournament: tournament
      ? {
          id: tournament.id,
          name: tournament.name,
          predictionDeadline: tournament.predictionDeadline.toISOString(),
        }
      : null,
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      group: t.group,
      flagEmoji: t.flagEmoji,
    })),
    matches: matches.map((m) => ({
      id: m.id,
      matchNumber: m.matchNumber,
      homeTeam: m.homeTeam?.name || m.homePlaceholder,
      awayTeam: m.awayTeam?.name || m.awayPlaceholder,
      isBonusMatch: m.isBonusMatch,
    })),
    bonusMatchCount: bonusMatches.length,
  };
}

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  const settings = await getSettings();

  return <AdminSettingsClient settings={settings} />;
}
