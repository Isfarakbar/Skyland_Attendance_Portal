import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');
    const month = searchParams.get('month'); // e.g. "10"
    const year = searchParams.get('year'); // e.g. "2026"

    let queryUserId = session.userId;
    // Allow Admin or HR to view another user's history
    if (targetUserId && ['admin', 'hr'].includes(session.role)) {
      queryUserId = targetUserId;
    }

    await connectToDatabase();

    const query: Record<string, unknown> = { user: queryUserId };

    if (year && month) {
      const monthPadded = month.padStart(2, '0');
      query.date = { $regex: `^${year}-${monthPadded}` };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('user', 'name email employeeId department designation')
      .lean();

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching attendance history';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
