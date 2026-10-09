import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, evaluateAttendanceStatus } from '@/lib/attendanceUtils';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
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
    const graceMinutes = settings?.gracePeriodMinutes || 15;

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
        breaks: [],
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        ipAddress,
      });
    } else {
      attendance.clockIn = now;
      attendance.status = evaluatedStatus;
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
