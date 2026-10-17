import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, evaluateAttendanceStatus } from '@/lib/attendanceUtils';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.userId).lean();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Account not found or deactivated' }, { status: 403 });
    }

    const isManagement = ['developer', 'admin', 'ceo', 'manager'].includes(session.role);
    if (!isManagement && user.workMode !== 'FIELD') {
      return NextResponse.json(
        {
          success: false,
          error: 'Office staff attendance is recorded exclusively via the Dahua biometric fingerprint terminal.',
        },
        { status: 403 }
      );
    }

    const settings = await CompanySettings.findOne();
    const timezone = settings?.timezone || 'Asia/Karachi';
    const now = new Date();
    const todayStr = getTodayDateString(now, timezone);

    let attendance = await Attendance.findOne({ user: session.userId, date: todayStr });

    if (attendance && attendance.clockIn) {
      return NextResponse.json(
        { success: false, error: 'You have already clocked in for today.' },
        { status: 400 }
      );
    }

    const startTimeStr = settings?.officeStartTime || '09:00';
    const graceMinutes = settings?.gracePeriodMinutes ?? 15;

    const evaluatedStatus = evaluateAttendanceStatus(now, startTimeStr, graceMinutes, timezone);

    // Client IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    if (!attendance) {
      attendance = await Attendance.create({
        user: session.userId,
        date: todayStr,
        clockIn: now,
        clockOut: null,
        status: evaluatedStatus,
        source: user.workMode === 'FIELD' ? 'FIELD' : 'WEB',
        breaks: [],
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        ipAddress,
        notes: 'Punch recorded via portal check-in',
      });
    } else {
      attendance.clockIn = now;
      attendance.status = evaluatedStatus;
      attendance.source = user.workMode === 'FIELD' ? 'FIELD' : 'WEB';
      attendance.ipAddress = ipAddress;
      await attendance.save();
    }

    return NextResponse.json({
      success: true,
      message: evaluatedStatus === 'LATE' ? 'Clocked in (Marked as Late)' : 'Clocked in successfully (On Time)',
      attendance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error clocking in';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
