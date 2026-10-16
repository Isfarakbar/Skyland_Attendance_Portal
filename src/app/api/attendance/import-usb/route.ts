import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, evaluateAttendanceStatus, calculateBreakMinutes, calculateWorkMinutes } from '@/lib/attendanceUtils';
import { differenceInMinutes } from 'date-fns';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'developer' && session.role !== 'ceo' && session.role !== 'manager')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rows: any[] = [];

    // Parse via XLSX (supports .xlsx, .xls, .csv, and tab-delimited text)
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } catch {
      // Fallback for raw text/dat files (e.g. attlog.dat space/tab separated)
      const text = buffer.toString('utf-8');
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      for (const line of lines) {
        const parts = line.split(/[\t, ]+/);
        if (parts.length >= 2) {
          rows.push({
            userId: parts[0],
            timestamp: parts.slice(1, 3).join(' '),
          });
        }
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'File is empty or unrecognized format' }, { status: 400 });
    }

    await connectToDatabase();
    const settings = await CompanySettings.findOne();
    const timezone = settings?.timezone || 'Asia/Karachi';
    const startTimeStr = settings?.officeStartTime || '09:00';
    const graceMinutes = settings?.gracePeriodMinutes || 15;
    const halfDayHours = settings?.halfDayThresholdHours || 4;

    const allUsers = await User.find({});
    const userMap = new Map<string, any>();
    for (const u of allUsers) {
      if (u.biometricUserId) userMap.set(String(u.biometricUserId).trim(), u);
      if (u.employeeId) userMap.set(String(u.employeeId).trim().toUpperCase(), u);
      // clean numeric
      const cleanNum = String(u.employeeId || '').replace(/\D+/g, '');
      if (cleanNum) userMap.set(cleanNum, u);
    }

    const importedResults: any[] = [];

    // Sort rows by time so punches apply in chronological order
    const parsedRows = rows.map((r) => {
      const rawId = r.userId || r.UserId || r.UserID || r['User ID'] || r.EnrollNumber || r['Enroll No'] || r.CardNo || r.PIN || r.pin || r['No.'] || r['No'] || r.id;
      const rawTime = r.timestamp || r.Timestamp || r.Time || r.DateTime || r['Date/Time'] || r['Date Time'] || r.time || r.date;
      return { rawId: String(rawId || '').trim(), rawTime, raw: r };
    }).filter((r) => r.rawId !== '');

    for (const item of parsedRows) {
      const user = userMap.get(item.rawId) || userMap.get(item.rawId.toUpperCase()) || userMap.get(item.rawId.replace(/^0+/, ''));
      if (!user) {
        importedResults.push({
          rawId: item.rawId,
          status: 'SKIPPED_USER_NOT_FOUND',
        });
        continue;
      }

      const punchDate = new Date(item.rawTime);
      if (isNaN(punchDate.getTime())) {
        continue;
      }

      const dateStr = getTodayDateString(punchDate, timezone);
      let attendance = await Attendance.findOne({ user: user._id, date: dateStr });

      if (!attendance) {
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
          notes: `Imported from Dahua USB log (${file.name})`,
        });

        importedResults.push({
          employeeName: user.name,
          employeeId: user.employeeId,
          date: dateStr,
          action: 'CLOCKED_IN',
          status: evaluatedStatus,
        });
      } else if (!attendance.clockIn || punchDate < new Date(attendance.clockIn)) {
        attendance.clockIn = punchDate;
        attendance.source = 'BIOMETRIC';
        await attendance.save();

        importedResults.push({
          employeeName: user.name,
          employeeId: user.employeeId,
          date: dateStr,
          action: 'UPDATED_CLOCK_IN',
        });
      } else {
        const diffFromIn = differenceInMinutes(punchDate, new Date(attendance.clockIn));
        if (diffFromIn >= 2 && (!attendance.clockOut || punchDate > new Date(attendance.clockOut))) {
          const totalBreak = calculateBreakMinutes(attendance.breaks || []);
          const totalWork = calculateWorkMinutes(attendance.clockIn, punchDate, totalBreak);

          attendance.clockOut = punchDate;
          attendance.totalBreakMinutes = totalBreak;
          attendance.totalWorkMinutes = totalWork;
          if (totalWork < halfDayHours * 60 && attendance.status !== 'LATE') {
            attendance.status = 'HALF_DAY';
          }
          await attendance.save();

          importedResults.push({
            employeeName: user.name,
            employeeId: user.employeeId,
            date: dateStr,
            action: 'CLOCKED_OUT',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${parsedRows.length} punch records from ${file.name}`,
      totalRows: parsedRows.length,
      syncedCount: importedResults.filter((r) => r.action).length,
      results: importedResults,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error importing USB attendance log';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
