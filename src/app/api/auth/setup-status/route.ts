import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const count = await User.countDocuments();
    return NextResponse.json({
      success: true,
      isFirstUser: count === 0,
      totalUsers: count,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error checking setup status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
