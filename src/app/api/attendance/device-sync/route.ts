import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Biometric device sync has been removed from this portal.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Biometric device sync has been removed from this portal.' },
    { status: 410 }
  );
}
