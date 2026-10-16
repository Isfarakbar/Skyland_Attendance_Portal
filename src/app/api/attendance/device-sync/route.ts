import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, evaluateAttendanceStatus, calculateBreakMinutes, calculateWorkMinutes } from '@/lib/attendanceUtils';
import { differenceInMinutes } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        // Fallback for form-urlencoded or plain text
        body = { text };
      }
    }

    // Extract raw items from whatever structure the biometric device sends
    let rawItems: any[] = [];
    if (Array.isArray(body)) {
      rawItems = body;
    } else if (Array.isArray(body.punches)) {
      rawItems = body.punches;
    } else if (Array.isArray(body.records)) {
      rawItems = body.records;
    } else if (Array.isArray(body.data)) {
      rawItems = body.data;
    } else if (Array.isArray(body.events)) {
      rawItems = body.events;
    } else if (body.punch) {
      rawItems = [body.punch];
    } else if (body && typeof body === 'object') {
      rawItems = [body];
    }

    if (rawItems.length === 0) {
      return NextResponse.json({ success: false, error: 'No punch records detected in request' }, { status: 400 });
    }

    await connectToDatabase();
    const settings = await CompanySettings.findOne();
    const timezone = settings?.timezone || 'Asia/Karachi';
    const startTimeStr = settings?.officeStartTime || '09:00';
    const graceMinutes = settings?.gracePeriodMinutes || 15;
    const halfDayHours = settings?.halfDayThresholdHours || 4;

    const results = [];

    for (const item of rawItems) {
      // 1. Resolve User Identifier across all device conventions
      const rawId =
        item.userId ??
        item.UserId ??
        item.UserID ??
        item.userid ??
        item.user_id ??
        item.EnrollNumber ??
        item.enroll_number ??
        item.pin ??
        item.Pin ??
        item.PIN ??
        item.CardNo ??
        item.card_no ??
        item.employeeNo ??
        item.employeeId ??
        item.id;

      if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
        continue;
      }

      const strId = String(rawId).trim();
      const numId = parseInt(strId, 10);
      const cleanNumericId = !isNaN(numId) ? String(numId) : null;
      const strippedLeadingZeros = strId.replace(/^0+/, '') || '0';

      // 2. Resolve Timestamp across all device conventions
      const rawTime =
        item.timestamp ??
        item.Timestamp ??
        item.Time ??
        item.time ??
        item.DateTime ??
        item.dateTime ??
        item.punch_time ??
        item.CreateTime ??
        item.UTC ??
        item.clock_time ??
        new Date().toISOString();

      let punchDate: Date;
      if (typeof rawTime === 'number') {
        // Unix timestamp in seconds or ms
        punchDate = new Date(rawTime > 1e11 ? rawTime : rawTime * 1000);
      } else {
        punchDate = new Date(rawTime);
      }

      if (isNaN(punchDate.getTime())) {
        punchDate = new Date();
      }

      const dateStr = getTodayDateString(punchDate, timezone);

      // 3. Multi-strategy user matching (handles "1", "001", "SKY-001", "SKY-1", etc.)
      const searchCriteria: any[] = [
        { biometricUserId: strId },
        { employeeId: strId.toUpperCase() },
      ];

      if (cleanNumericId) {
        searchCriteria.push({ biometricUserId: cleanNumericId });
        searchCriteria.push({ employeeId: `SKY-${cleanNumericId.padStart(3, '0')}` });
        searchCriteria.push({ employeeId: `SKY-${cleanNumericId}` });
      }

      if (strippedLeadingZeros && strippedLeadingZeros !== strId) {
        searchCriteria.push({ biometricUserId: strippedLeadingZeros });
      }

      const user = await User.findOne({ $or: searchCriteria });

      if (!user) {
        results.push({
          userId: strId,
          status: 'SKIPPED_USER_NOT_FOUND',
          message: `No employee matched device ID '${strId}'`,
        });
        continue;
      }

      let attendance = await Attendance.findOne({ user: user._id, date: dateStr });
      const verifyMode = item.verifyMode || item.VerifyMode || item.mode || 'Fingerprint';

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
          notes: `Punch recorded via Dahua Terminal (${verifyMode})`,
        });

        results.push({
          userId: strId,
          employeeName: user.name,
          employeeId: user.employeeId,
          action: 'CLOCKED_IN',
          status: evaluatedStatus,
          time: punchDate.toISOString(),
        });
      } else if (!attendance.clockIn) {
        const evaluatedStatus = evaluateAttendanceStatus(punchDate, startTimeStr, graceMinutes, timezone);
        attendance.clockIn = punchDate;
        attendance.status = evaluatedStatus;
        attendance.source = 'BIOMETRIC';
        await attendance.save();

        results.push({
          userId: strId,
          employeeName: user.name,
          employeeId: user.employeeId,
          action: 'CLOCKED_IN',
          status: evaluatedStatus,
          time: punchDate.toISOString(),
        });
      } else {
        // Subsequent punch -> Check if at least 2 minutes have elapsed since clockIn
        const diffFromIn = differenceInMinutes(punchDate, new Date(attendance.clockIn));
        if (diffFromIn >= 2) {
          const totalBreak = calculateBreakMinutes(attendance.breaks || []);
          const totalWork = calculateWorkMinutes(attendance.clockIn, punchDate, totalBreak);

          attendance.clockOut = punchDate;
          attendance.totalBreakMinutes = totalBreak;
          attendance.totalWorkMinutes = totalWork;

          if (totalWork < halfDayHours * 60 && attendance.status !== 'LATE') {
            attendance.status = 'HALF_DAY';
          }

          await attendance.save();

          results.push({
            userId: strId,
            employeeName: user.name,
            employeeId: user.employeeId,
            action: 'CLOCKED_OUT',
            workMinutes: totalWork,
            time: punchDate.toISOString(),
          });
        } else {
          results.push({
            userId: strId,
            employeeName: user.name,
            action: 'IGNORED_RECENT_PUNCH',
            message: 'Duplicate punch within 2 minutes of clock in',
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
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error in sync endpoint';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
