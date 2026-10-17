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

    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === null ||
      longitude === null ||
      isNaN(latNum) ||
      isNaN(lngNum) ||
      (latNum === 0 && lngNum === 0) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Live GPS location is required to mark attendance! Please turn ON your device Location Services and allow location permission.',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not found or deactivated' }, { status: 403 });
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

      if (attendance.clockOut) {
        return NextResponse.json({ success: false, error: 'You have already checked out for today' }, { status: 400 });
      }

      const workMins = calculateWorkMinutes(attendance.clockIn, now, attendance.totalBreakMinutes || 0);
      attendance.clockOut = now;
      attendance.totalWorkMinutes = workMins;

      const halfDayHours = settings?.halfDayThresholdHours || 4;
      if (workMins < halfDayHours * 60) {
        attendance.status = 'HALF_DAY';
      } else {
        attendance.status = evaluateAttendanceStatus(
          attendance.clockIn,
          settings?.officeStartTime || '09:00',
          settings?.gracePeriodMinutes ?? 15,
          timezone
        );
      }

      attendance.location = {
        latitude: latNum,
        longitude: lngNum,
        siteName: siteName?.trim() || attendance.location?.siteName || 'Verified GPS Location',
        accuracy: accuracy ? Number(accuracy) : attendance.location?.accuracy,
      };

      if (notes?.trim()) {
        attendance.notes = `${attendance.notes ? attendance.notes + ' • ' : ''}${notes.trim()}`;
      }
      await attendance.save();

      return NextResponse.json({
        success: true,
        message: 'Attendance check-out recorded successfully!',
        attendance,
      });
    }

    // Default action: 'check-in'
    if (attendance && attendance.clockIn) {
      return NextResponse.json(
        { success: false, error: 'You have already marked your check-in for today', attendance },
        { status: 400 }
      );
    }

    const evaluatedStatus = evaluateAttendanceStatus(
      now,
      settings?.officeStartTime || '09:00',
      settings?.gracePeriodMinutes ?? 15,
      timezone
    );

    const locationLabel = siteName?.trim() || 'Verified GPS Location';
    const noteText = notes?.trim()
      ? (siteName?.trim() ? `${locationLabel}: ${notes.trim()}` : notes.trim())
      : locationLabel;

    if (!attendance) {
      attendance = new Attendance({
        user: session.userId,
        date: todayStr,
        clockIn: now,
        status: evaluatedStatus,
        isFieldCheckIn: true,
        location: {
          latitude: latNum,
          longitude: lngNum,
          siteName: locationLabel,
          accuracy: accuracy ? Number(accuracy) : undefined,
        },
        notes: noteText,
        source: 'WEB',
      });
    } else {
      attendance.clockIn = now;
      attendance.status = evaluatedStatus;
      attendance.isFieldCheckIn = true;
      attendance.source = 'WEB';
      attendance.location = {
        latitude: latNum,
        longitude: lngNum,
        siteName: locationLabel,
        accuracy: accuracy ? Number(accuracy) : undefined,
      };
      attendance.notes = noteText;
    }

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: evaluatedStatus === 'LATE'
        ? 'Attendance marked (Recorded as Late Arrival)'
        : 'Attendance marked successfully (On Time)!',
      attendance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error marking attendance';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
