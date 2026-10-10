import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import DailyTask from '@/models/DailyTask';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, DEFAULT_TIMEZONE } from '@/lib/attendanceUtils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const isManagement = ['developer', 'admin', 'manager'].includes(session.role);

    // If regular employee, only allow viewing self
    if (!isManagement && session.userId !== id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const employee = await User.findById(id).select('-password').lean();
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const settings = await CompanySettings.findOne().lean();
    const timezone = settings?.timezone || DEFAULT_TIMEZONE;
    const todayDate = getTodayDateString(new Date(), timezone);
    const currentMonth = todayDate.substring(0, 7); // "YYYY-MM"

    // 1. Today's Attendance
    const todayAttendance = await Attendance.findOne({ user: id, date: todayDate }).lean();

    // 2. Monthly Attendance Records
    const monthAttendance = await Attendance.find({
      user: id,
      date: { $regex: `^${currentMonth}` },
    }).sort({ date: -1 }).lean();

    // Calculate monthly stats
    let presentDays = 0;
    let lateDays = 0;
    let totalOffs = 0;
    let totalHalfLeaves = 0;

    for (const rec of monthAttendance) {
      if (rec.status === 'PRESENT') {
        presentDays++;
      } else if (rec.status === 'LATE') {
        lateDays++;
        presentDays++;
      } else if (rec.status === 'HALF_LEAVE' || rec.status === 'HALF_DAY') {
        totalHalfLeaves++;
      } else if (rec.status === 'OFF' || rec.status === 'ABSENT' || rec.status === 'ON_LEAVE') {
        totalOffs++;
      }
    }

    const baseSalary = employee.baseSalary || 30000;
    const dailyRate = Math.round(baseSalary / 30);
    const halfDayRate = Math.round(dailyRate / 2);
    const excessOffs = Math.max(0, totalOffs - 1);
    const excessHalfLeaves = Math.max(0, totalHalfLeaves - 1);
    const offDeduction = excessOffs * dailyRate;
    const halfLeaveDeduction = excessHalfLeaves * halfDayRate;
    const totalDeduction = offDeduction + halfLeaveDeduction;
    const netSalary = Math.max(0, baseSalary - totalDeduction);

    // 3. Daily Tasks Submissions (recent 50)
    const tasks = await DailyTask.find({ user: id })
      .sort({ date: -1, createdAt: -1 })
      .limit(50)
      .lean();

    // 4. Recent Attendance Log (last 30 entries)
    const recentAttendance = await Attendance.find({ user: id })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      success: true,
      employee: {
        ...employee,
        dailyRate,
      },
      todayDate,
      todayAttendance: todayAttendance || null,
      monthlySummary: {
        month: currentMonth,
        baseSalary,
        dailyRate,
        presentDays,
        lateDays,
        totalOffs,
        excessOffs,
        totalHalfLeaves,
        excessHalfLeaves,
        totalDeduction,
        netSalary,
      },
      tasks,
      recentAttendance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching employee overview';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
