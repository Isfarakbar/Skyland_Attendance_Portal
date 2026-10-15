import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, evaluateAttendanceStatus, calculateBreakMinutes, calculateWorkMinutes } from '@/lib/attendanceUtils';
import { differenceInMinutes } from 'date-fns';

export interface IDevicePunch {
  userId: string;
  timestamp: string; // ISO or 'YYYY-MM-DD HH:mm:ss'
  type?: 'IN' | 'OUT' | 'AUTO';
  verifyMode?: string; // 'FINGERPRINT' | 'CARD' | 'FACE' | 'PASSWORD'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const punches: IDevicePunch[] = Array.isArray(body.punches) ? body.punches : (body.punch ? [body.punch] : []);

    if (punches.length === 0) {
      return NextResponse.json({ success: false, error: 'No punches provided in request' }, { status: 400 });
    }

    await connectToDatabase();
    const settings = await CompanySettings.findOne();
    const timezone = settings?.timezone || 'Asia/Karachi';
    const startTimeStr = settings?.officeStartTime || '09:00';
    const graceMinutes = settings?.gracePeriodMinutes || 15;
    const halfDayHours = settings?.halfDayThresholdHours || 4;

    const results = [];

    for (const p of punches) {
      if (!p.userId) continue;

      const punchDate = new Date(p.timestamp);
      if (isNaN(punchDate.getTime())) continue;

      const dateStr = getTodayDateString(punchDate, timezone);

      // Find user by biometricUserId first, or fallback to employeeId
      const user = await User.findOne({
        $or: [
          { biometricUserId: String(p.userId).trim() },
          { employeeId: String(p.userId).trim().toUpperCase() },
        ],
      });

      if (!user) {
        results.push({
          userId: p.userId,
          status: 'SKIPPED_USER_NOT_FOUND',
          message: `No employee found with biometric ID or Employee ID '${p.userId}'`,
        });
        continue;
      }

      let attendance = await Attendance.findOne({ user: user._id, date: dateStr });

      if (!attendance) {
        // First punch of the day -> Clock In
        const evaluatedStatus = evaluateAttendanceStatus(punchDate, startTimeStr, graceMinutes, timezone);
        attendance = await Attendance.create({
          user: user._id,
          date: dateStr,
          clockIn: punchDate,
          clockOut: null,
          status: evaluatedStatus,
          source: 'BIOMETRIC',
          breaks: [],
          totalWorkMinutes: 0,
          totalBreakMinutes: 0,
          notes: `Punch recorded via Dahua Terminal (${p.verifyMode || 'Fingerprint'})`,
        });

        results.push({
          userId: p.userId,
          employeeName: user.name,
          action: 'CLOCKED_IN',
          status: evaluatedStatus,
          time: punchDate.toISOString(),
        });
      } else if (!attendance.clockIn) {
        // Attendance record existed without clock-in
        const evaluatedStatus = evaluateAttendanceStatus(punchDate, startTimeStr, graceMinutes, timezone);
        attendance.clockIn = punchDate;
        attendance.status = evaluatedStatus;
        attendance.source = 'BIOMETRIC';
        await attendance.save();

        results.push({
          userId: p.userId,
          employeeName: user.name,
          action: 'CLOCKED_IN',
          status: evaluatedStatus,
          time: punchDate.toISOString(),
        });
      } else {
        // User already has clock-in
        // If the punch is more than 5 minutes after clock-in, treat as clock-out (or update last clock-out)
        const diffFromIn = differenceInMinutes(punchDate, new Date(attendance.clockIn));
        if (diffFromIn >= 5) {
          const totalBreak = calculateBreakMinutes(attendance.breaks || []);
          const totalWork = calculateWorkMinutes(attendance.clockIn, punchDate, totalBreak);

          attendance.clockOut = punchDate;
          attendance.totalBreakMinutes = totalBreak;
          attendance.totalWorkMinutes = totalWork;

          // If worked less than half-day threshold, mark HALF_DAY
          if (totalWork < halfDayHours * 60 && attendance.status !== 'LATE') {
            attendance.status = 'HALF_DAY';
          }

          await attendance.save();

          results.push({
            userId: p.userId,
            employeeName: user.name,
            action: 'CLOCKED_OUT',
            workMinutes: totalWork,
            time: punchDate.toISOString(),
          });
        } else {
          results.push({
            userId: p.userId,
            employeeName: user.name,
            action: 'IGNORED_DUPLICATE_PUNCH',
            message: 'Punch occurred within 5 minutes of clock-in',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} punch records`,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error syncing device punches';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET method for manual sync trigger or ping check
export async function GET() {
  try {
    await connectToDatabase();
    const settings = await CompanySettings.findOne();

    return NextResponse.json({
      success: true,
      status: 'Device sync service is online and ready',
      timezone: settings?.timezone || 'Asia/Karachi',
      officeStartTime: settings?.officeStartTime || '09:00',
      gracePeriodMinutes: settings?.gracePeriodMinutes || 15,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error in sync endpoint';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
