import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, calculateBreakMinutes } from '@/lib/attendanceUtils';
import { differenceInMinutes } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action, note } = await req.json(); // action: 'start' | 'end'
    await connectToDatabase();
    const settings = await CompanySettings.findOne();
    const timezone = settings?.timezone || 'Asia/Karachi';
    const now = new Date();
    const todayStr = getTodayDateString(now, timezone);

    const attendance = await Attendance.findOne({ user: session.userId, date: todayStr });

    if (!attendance || !attendance.clockIn) {
      return NextResponse.json(
        { success: false, error: 'You must clock in before taking a break.' },
        { status: 400 }
      );
    }

    if (attendance.clockOut) {
      return NextResponse.json(
        { success: false, error: 'You have already clocked out for today.' },
        { status: 400 }
      );
    }

    const openBreak = attendance.breaks?.find((b) => !b.endTime);

    if (action === 'start') {
      if (openBreak) {
        return NextResponse.json(
          { success: false, error: 'You already have an active break ongoing.' },
          { status: 400 }
        );
      }

      attendance.breaks.push({
        startTime: now,
        endTime: null,
        durationMinutes: 0,
        note: note || 'General Break',
      });

      await attendance.save();

      return NextResponse.json({
        success: true,
        message: 'Break started',
        attendance,
      });
    } else if (action === 'end') {
      if (!openBreak) {
        return NextResponse.json(
          { success: false, error: 'No active break found to end.' },
          { status: 400 }
        );
      }

      openBreak.endTime = now;
      openBreak.durationMinutes = Math.max(
        0,
        differenceInMinutes(now, new Date(openBreak.startTime))
      );

      attendance.totalBreakMinutes = calculateBreakMinutes(attendance.breaks);
      await attendance.save();

      return NextResponse.json({
        success: true,
        message: 'Break ended. Welcome back!',
        attendance,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid break action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error managing break';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
