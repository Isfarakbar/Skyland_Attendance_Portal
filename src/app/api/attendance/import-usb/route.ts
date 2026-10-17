import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Biometric USB import has been removed from this portal.' },
    { status: 410 }
  );
}
