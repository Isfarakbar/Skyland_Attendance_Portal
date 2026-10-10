import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, evaluateAttendanceStatus, DEFAULT_TIMEZONE, calculateWorkMinutes } from '@/lib/attendanceUtils';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { latitude, longitude, accuracy, siteName, notes, action } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'GPS coordinates (latitude and longitude) are required for field site check-in.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const settings = await CompanySettings.findOne().lean();
    const timezone = settings?.timezone || DEFAULT_TIMEZONE;
    const todayStr = getTodayDateString(new Date(), timezone);

    let attendance = await Attendance.findOne({ user: session.userId, date: todayStr });

    const now = new Date();

    if (action === 'check-out') {
      if (!attendance || !attendance.clockIn) {
        return NextResponse.json({ success: false, error: 'Cannot check out before checking in' }, { status: 400 });
      }

      attendance.clockOut = now;
      attendance.totalWorkMinutes = calculateWorkMinutes(attendance.clockIn, now, attendance.totalBreakMinutes || 0);
      if (siteName) {
        attendance.notes = `${attendance.notes ? attendance.notes + ' • ' : ''}Checked out from ${siteName.trim()}`;
      }
      await attendance.save();

      return NextResponse.json({
        success: true,
        message: 'Field site check-out recorded successfully',
        attendance,
      });
    }

    // Default action: 'check-in'
    if (attendance && attendance.clockIn) {
      return NextResponse.json(
        { success: false, error: 'You have already checked in for today', attendance },
        { status: 400 }
      );
    }

    const evaluatedStatus = evaluateAttendanceStatus(
      now,
      settings?.officeStartTime || '09:00',
      settings?.gracePeriodMinutes || 15,
      timezone
    );

    const siteLabel = siteName ? siteName.trim() : 'On-Site Field Duty';
    const noteText = notes ? `${siteLabel}: ${notes.trim()}` : siteLabel;

    if (!attendance) {
      attendance = new Attendance({
        user: session.userId,
        date: todayStr,
        clockIn: now,
        status: evaluatedStatus,
        isFieldCheckIn: true,
        location: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          siteName: siteLabel,
          accuracy: accuracy ? Number(accuracy) : undefined,
        },
        notes: noteText,
      });
    } else {
      attendance.clockIn = now;
      attendance.status = evaluatedStatus;
      attendance.isFieldCheckIn = true;
      attendance.location = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        siteName: siteLabel,
        accuracy: accuracy ? Number(accuracy) : undefined,
      };
      attendance.notes = noteText;
    }

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: `Checked in successfully at ${siteLabel}!`,
      attendance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error processing field check-in';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
