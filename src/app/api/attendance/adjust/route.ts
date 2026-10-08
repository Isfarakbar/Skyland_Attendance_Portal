import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import { calculateWorkMinutes, calculateBreakMinutes } from '@/lib/attendanceUtils';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    const { userId, date, clockIn, clockOut, status, regularizedReason } = await req.json();

    if (!userId || !date) {
      return NextResponse.json({ success: false, error: 'User ID and date are required' }, { status: 400 });
    }

    await connectToDatabase();

    let attendance = await Attendance.findOne({ user: userId, date });

    const clockInDate = clockIn ? new Date(clockIn) : null;
    const clockOutDate = clockOut ? new Date(clockOut) : null;

    if (!attendance) {
      const workMins = calculateWorkMinutes(clockInDate, clockOutDate, 0);
      attendance = await Attendance.create({
        user: userId,
        date,
        clockIn: clockInDate,
        clockOut: clockOutDate,
        status: status || 'PRESENT',
        totalWorkMinutes: workMins,
        totalBreakMinutes: 0,
        isRegularized: true,
        regularizedReason: regularizedReason || 'Manual adjustment by Management',
        regularizedBy: session.userId,
      });
    } else {
      if (clockIn !== undefined) attendance.clockIn = clockInDate;
      if (clockOut !== undefined) attendance.clockOut = clockOutDate;
      if (status) attendance.status = status;
      attendance.isRegularized = true;
      attendance.regularizedReason = regularizedReason || 'Manual adjustment by Management';
      attendance.regularizedBy = session.userId as unknown as import('mongoose').Types.ObjectId;

      const breakMins = calculateBreakMinutes(attendance.breaks || []);
      attendance.totalWorkMinutes = calculateWorkMinutes(attendance.clockIn, attendance.clockOut, breakMins);
      await attendance.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance successfully adjusted',
      attendance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error adjusting attendance';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
