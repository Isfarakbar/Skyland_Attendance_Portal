import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance, { AttendanceStatus } from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, DEFAULT_TIMEZONE, parseTimeToDate } from '@/lib/attendanceUtils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Desk Register access required' }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const settings = await CompanySettings.findOne().lean();
    const timezone = settings?.timezone || DEFAULT_TIMEZONE;
    const date = searchParams.get('date') || getTodayDateString(new Date(), timezone);
    const registerOrder: string[] = (settings as any)?.deskRegisterOrder || [];
    const orderMap = new Map(registerOrder.map((id: string, idx: number) => [String(id), idx]));

    // Fetch all active staff employees (Admin, Manager/CEO, and Developer are ghost management)
    const employees = await User.find({
      isActive: true,
      role: { $nin: ['admin', 'developer', 'ceo'] },
    })
      .select('_id name email employeeId department designation baseSalary role workMode weeklyOffDays weeklyHalfDays sortOrder')
      .lean();

    // Sort by custom order first, then by sortOrder or alphabetical
    employees.sort((a, b) => {
      const idA = String(a._id);
      const idB = String(b._id);
      const hasA = orderMap.has(idA);
      const hasB = orderMap.has(idB);

      if (hasA && hasB) {
        return orderMap.get(idA)! - orderMap.get(idB)!;
      }
      if (hasA) return -1;
      if (hasB) return 1;

      const orderA = typeof (a as any).sortOrder === 'number' && (a as any).sortOrder > 0 ? (a as any).sortOrder : 99999;
      const orderB = typeof (b as any).sortOrder === 'number' && (b as any).sortOrder > 0 ? (b as any).sortOrder : 99999;
      if (orderA !== orderB) return orderA - orderB;

      return a.name.localeCompare(b.name);
    });

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
        workMode: (emp as any).workMode || 'OFFICE',
        weeklyOffDays: (emp as any).weeklyOffDays ?? [0, 6],
        weeklyHalfDays: (emp as any).weeklyHalfDays ?? [],
        status: (record?.status as AttendanceStatus) || null,
        clockInTime: clockInTimeStr,
        clockOutTime: clockOutTimeStr,
        notes: record?.notes || '',
        isFieldCheckIn: !!record?.isFieldCheckIn,
        isWorkFromHome: !!record?.isWorkFromHome || record?.workMode === 'WFH',
        location: record?.location || null,
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
    if (!session || !['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Desk Register access required' }, { status: 403 });
    }

    const { date, entries } = (await req.json()) as { date: string; entries: RegisterEntryPayload[] };

    if (!date || !Array.isArray(entries)) {
      return NextResponse.json({ success: false, error: 'Invalid date or entries' }, { status: 400 });
    }

    await connectToDatabase();

    const validEntries = entries.filter((entry) => !!entry.status);

    const bulkOps = validEntries.map((entry) => {
      const isOff = entry.status === 'OFF' || entry.status === 'ABSENT';
      const clockInDate = isOff ? null : parseTimeToDate(date, entry.clockInTime);
      const clockOutDate = isOff ? null : parseTimeToDate(date, entry.clockOutTime);
      let totalWorkMinutes = 0;

      if (clockInDate && clockOutDate && clockOutDate > clockInDate) {
        totalWorkMinutes = Math.round((clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60));
      }

      return {
        updateOne: {
          filter: { user: entry.userId, date },
          update: {
            $set: {
              status: entry.status,
              clockIn: clockInDate,
              clockOut: clockOutDate,
              totalWorkMinutes,
              notes: entry.notes?.trim() || '',
              isRegularized: true,
              regularizedReason: `Desk register entry for ${date} by Management`,
              regularizedBy: session.userId,
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Desk Register access required' }, { status: 403 });
    }

    const body = await req.json();
    const { orderedUserIds, reset } = body;

    await connectToDatabase();

    if (reset) {
      await CompanySettings.findOneAndUpdate({}, { $set: { deskRegisterOrder: [] } }, { upsert: true });
      await User.updateMany({ role: { $nin: ['admin', 'developer', 'ceo'] } }, { $set: { sortOrder: 0 } });
      return NextResponse.json({ success: true, message: 'Register order reset to default A-Z alphabetical order' });
    }

    if (!Array.isArray(orderedUserIds)) {
      return NextResponse.json({ success: false, error: 'orderedUserIds must be an array of user IDs' }, { status: 400 });
    }

    // 1. Save order in CompanySettings
    await CompanySettings.findOneAndUpdate(
      {},
      { $set: { deskRegisterOrder: orderedUserIds } },
      { upsert: true }
    );

    // 2. Synchronize sortOrder on User documents
    const bulkOps = orderedUserIds.map((userId: string, idx: number) => ({
      updateOne: {
        filter: { _id: userId },
        update: { $set: { sortOrder: idx + 1 } },
      },
    }));

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      success: true,
      message: 'Custom register display order saved successfully',
      orderedUserIds,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating desk register order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
