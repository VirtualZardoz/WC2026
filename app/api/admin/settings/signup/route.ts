import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { isRegistrationEnabled, setRegistrationEnabled } from '@/lib/feature-flags';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enabled = await isRegistrationEnabled();
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Error fetching signup setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabled } = await request.json();
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await setRegistrationEnabled(enabled);
    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error('Error updating signup setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
