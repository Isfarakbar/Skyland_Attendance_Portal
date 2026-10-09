import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance, { AttendanceStatus } from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, DEFAULT_TIMEZONE } from '@/lib/attendanceUtils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Desk Register access required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const settings = await CompanySettings.findOne().lean();
    const timezone = settings?.timezone || DEFAULT_TIMEZONE;
    const date = searchParams.get('date') || getTodayDateString(new Date(), timezone);

    // Fetch all active employees
    const employees = await User.find({ isActive: true })
      .select('_id name email employeeId department designation baseSalary role')
      .sort({ name: 1 })
      .lean();

    // Fetch existing attendance records for this date
    const attendanceRecords = await Attendance.find({ date }).lean();
    const attendanceMap = new Map();
    for (const record of attendanceRecords) {
      attendanceMap.set(String(record.user), record);
    }

    // Combine employees with attendance data
    const list = employees.map((emp) => {
      const record = attendanceMap.get(String(emp._id));
      let clockInTimeStr = '';
      let clockOutTimeStr = '';

      if (record?.clockIn) {
        try {
          const d = new Date(record.clockIn);
          const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
          }).format(d);
          clockInTimeStr = parts;
        } catch {
          // fallback
          clockInTimeStr = '';
        }
      }

      if (record?.clockOut) {
        try {
          const d = new Date(record.clockOut);
          const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
          }).format(d);
          clockOutTimeStr = parts;
        } catch {
          clockOutTimeStr = '';
        }
      }

      return {
        userId: emp._id,
        name: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        designation: emp.designation,
        baseSalary: emp.baseSalary || 30000,
        status: (record?.status as AttendanceStatus) || null,
        clockInTime: clockInTimeStr,
        clockOutTime: clockOutTimeStr,
        notes: record?.notes || '',
        isSaved: !!record,
      };
    });

    return NextResponse.json({
      success: true,
      date,
      timezone,
      employees: list,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching desk register';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

interface RegisterEntryPayload {
  userId: string;
  status: AttendanceStatus;
  clockInTime?: string; // "HH:mm"
  clockOutTime?: string; // "HH:mm"
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Desk Register access required' }, { status: 403 });
    }

    const { date, entries } = (await req.json()) as { date: string; entries: RegisterEntryPayload[] };

    if (!date || !Array.isArray(entries)) {
      return NextResponse.json({ success: false, error: 'Invalid date or entries' }, { status: 400 });
    }

    await connectToDatabase();

    const bulkOps = entries.map((entry) => {
      let clockInDate: Date | null = null;
      let clockOutDate: Date | null = null;
      let totalWorkMinutes = 0;

      if (entry.clockInTime && entry.clockInTime.trim()) {
        const [h, m] = entry.clockInTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          // Construct ISO date string in UTC or standard
          clockInDate = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
        }
      }

      if (entry.clockOutTime && entry.clockOutTime.trim()) {
        const [h, m] = entry.clockOutTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          clockOutDate = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
        }
      }

      if (clockInDate && clockOutDate && clockOutDate > clockInDate) {
        totalWorkMinutes = Math.round((clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60));
      }

      return {
        updateOne: {
          filter: { user: entry.userId, date },
          update: {
            $set: {
              status: entry.status || 'PRESENT',
              clockIn: clockInDate,
              clockOut: clockOutDate,
              totalWorkMinutes,
              notes: entry.notes?.trim() || '',
            },
          },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${bulkOps.length} desk register records for ${date}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating desk register';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
