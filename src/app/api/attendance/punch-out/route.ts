import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, calculateBreakMinutes, calculateWorkMinutes, evaluateAttendanceStatus } from '@/lib/attendanceUtils';
import { differenceInMinutes } from 'date-fns';

export async function POST() {
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

    const attendance = await Attendance.findOne({ user: session.userId, date: todayStr });

    if (!attendance || !attendance.clockIn) {
      return NextResponse.json(
        { success: false, error: 'You have not clocked in yet today.' },
        { status: 400 }
      );
    }

    if (attendance.clockOut) {
      return NextResponse.json(
        { success: false, error: 'You have already clocked out for today.' },
        { status: 400 }
      );
    }

    // If an open break exists, close it now
    if (attendance.breaks && attendance.breaks.length > 0) {
      const openBreak = attendance.breaks.find((b) => !b.endTime);
      if (openBreak) {
        openBreak.endTime = now;
        openBreak.durationMinutes = Math.max(
          0,
          differenceInMinutes(now, new Date(openBreak.startTime))
        );
      }
    }

    const totalBreakMinutes = calculateBreakMinutes(attendance.breaks || []);
    const totalWorkMinutes = calculateWorkMinutes(attendance.clockIn, now, totalBreakMinutes);

    attendance.clockOut = now;
    attendance.totalBreakMinutes = totalBreakMinutes;
    attendance.totalWorkMinutes = totalWorkMinutes;

    // Check half-day threshold
    const halfDayHours = settings?.halfDayThresholdHours || 4;
    if (totalWorkMinutes < halfDayHours * 60) {
      attendance.status = 'HALF_DAY';
    } else {
      attendance.status = evaluateAttendanceStatus(
        attendance.clockIn,
        settings?.officeStartTime || '09:00',
        settings?.gracePeriodMinutes ?? 15,
        timezone
      );
    }

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: 'Clocked out successfully!',
      attendance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error clocking out';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
