import { NextResponse } from 'next/server';
import { seedInitialData } from '@/lib/seed';

export async function POST() {
  try {
    const res = await seedInitialData();
    return NextResponse.json({ success: true, ...res });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to seed database';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await seedInitialData();
    return NextResponse.json({ success: true, ...res });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to seed database';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
