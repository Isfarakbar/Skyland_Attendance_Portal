import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { isValidMonthParam } from '@/lib/attendanceUtils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');
    const month = searchParams.get('month'); // e.g. "2026-10" or "10"
    const year = searchParams.get('year'); // e.g. "2026"

    let queryUserId = session.userId;
    // Allow Developer, Admin, CEO, or Manager to view another user's history
    if (targetUserId && ['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      queryUserId = targetUserId;
    }

    await connectToDatabase();

    const query: Record<string, unknown> = { user: queryUserId };

    if (month && month.includes('-')) {
      if (!isValidMonthParam(month)) {
        return NextResponse.json({ success: false, error: 'Invalid month format (expected YYYY-MM)' }, { status: 400 });
      }
      query.date = { $regex: `^${month.trim()}` };
    } else if (year && month) {
      const monthPadded = month.trim().padStart(2, '0');
      const combined = `${year.trim()}-${monthPadded}`;
      if (!isValidMonthParam(combined)) {
        return NextResponse.json({ success: false, error: 'Invalid year or month parameter' }, { status: 400 });
      }
      query.date = { $regex: `^${combined}` };
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
