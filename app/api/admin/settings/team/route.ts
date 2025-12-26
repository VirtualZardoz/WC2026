import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { searchCountries, findCountry, isValidCountryCode } from '@/lib/countries';

// GET: Search for countries (for autocomplete)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ matches: [] });
  }

  const matches = searchCountries(query, 8);
  return NextResponse.json({ matches });
}

// POST: Update team name and/or code
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { teamId, name, code, autoResolve } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Get current team
    const currentTeam = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!currentTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const updateData: { name?: string; code?: string } = {};

    // Handle name update
    if (name && name !== currentTeam.name) {
      updateData.name = name;

      // If autoResolve is true, try to find the country code automatically
      if (autoResolve && !code) {
        const match = findCountry(name);
        if (match && match.similarity >= 70) {
          // Check if this code is already used by another team
          const existingTeam = await prisma.team.findUnique({
            where: { code: match.country.iso2 },
          });

          if (!existingTeam || existingTeam.id === teamId) {
            updateData.code = match.country.iso2;
          }
        }
      }
    }

    // Handle explicit code update
    if (code) {
      const normalizedCode = code.toLowerCase();

      // Validate the code
      if (!isValidCountryCode(normalizedCode)) {
        return NextResponse.json(
          { error: `Invalid country code: ${code}. Please use a valid FIFA or ISO country code.` },
          { status: 400 }
        );
      }

      // Check if code is already used by another team
      const existingTeam = await prisma.team.findUnique({
        where: { code: normalizedCode },
      });

      if (existingTeam && existingTeam.id !== teamId) {
        return NextResponse.json(
          { error: `Country code "${code}" is already assigned to team "${existingTeam.name}"` },
          { status: 400 }
        );
      }

      updateData.code = normalizedCode;
    }

    // Perform update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No changes to update', team: currentTeam });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });

    return NextResponse.json({
      team: updatedTeam,
      resolved: updateData.code ? {
        code: updateData.code,
        autoResolved: autoResolve && !code,
      } : null,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}
