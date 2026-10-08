import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // e.g. "10"
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (month && year) {
      const monthPadded = month.padStart(2, '0');
      query.date = { $regex: `^${year}-${monthPadded}` };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1, 'user.name': 1 })
      .populate('user', 'name email employeeId department designation')
      .lean();

    const reportRows = records.map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (r.user as any) || {};
      const clockInStr = r.clockIn ? format(new Date(r.clockIn), 'hh:mm:ss a') : '--';
      const clockOutStr = r.clockOut ? format(new Date(r.clockOut), 'hh:mm:ss a') : '--';
      const workHours = (r.totalWorkMinutes / 60).toFixed(2);

      return {
        'Employee ID': user.employeeId || 'N/A',
        'Employee Name': user.name || 'Unknown',
        'Department': user.department || 'General',
        'Designation': user.designation || 'Team Member',
        'Date': r.date,
        'Clock In': clockInStr,
        'Clock Out': clockOutStr,
        'Work Hours': `${workHours} hrs`,
        'Break Minutes': r.totalBreakMinutes || 0,
        'Status': r.status,
        'Regularized': r.isRegularized ? 'Yes' : 'No',
        'IP Address': r.ipAddress || '',
      };
    });

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `Skyland_Attendance_${year}_${month || 'all'}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating export report';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
