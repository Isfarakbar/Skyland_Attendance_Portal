import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, calculateBreakMinutes } from '@/lib/attendanceUtils';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const settings = await CompanySettings.findOne();
    const timezone = settings?.timezone || 'Asia/Karachi';
    const todayStr = getTodayDateString(new Date(), timezone);

    const attendance = await Attendance.findOne({ user: session.userId, date: todayStr });

    let state = 'NOT_CLOCKED_IN';
    let currentBreak = null;

    if (attendance) {
      if (attendance.clockOut) {
        state = 'CLOCKED_OUT';
      } else if (attendance.clockIn) {
        // Check if an active open break exists
        const activeBreak = attendance.breaks?.find((b) => !b.endTime);
        if (activeBreak) {
          state = 'ON_BREAK';
          currentBreak = activeBreak;
        } else {
          state = 'WORKING';
        }
      }
    }

    const totalBreakMins = attendance ? calculateBreakMinutes(attendance.breaks || []) : 0;

    return NextResponse.json({
      success: true,
      state,
      attendance,
      currentBreak,
      totalBreakMinutes: totalBreakMins,
      settings: settings || {
        officeStartTime: '09:00',
        officeEndTime: '18:00',
        gracePeriodMinutes: 15,
      },
      todayDate: todayStr,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching attendance';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
