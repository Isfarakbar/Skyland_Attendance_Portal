import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import DailyTask from '@/models/DailyTask';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, DEFAULT_TIMEZONE } from '@/lib/attendanceUtils';
import { resolvePayrollTax } from '@/lib/taxCalculator';

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
    const isManagement = ['developer', 'admin', 'ceo', 'manager'].includes(session.role);

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

    // Calculate monthly stats adhering to employee's approved weekly schedule
    const empOffDays = Array.isArray(employee.weeklyOffDays) && employee.weeklyOffDays.length > 0
      ? employee.weeklyOffDays
      : [0, 6];
    const empHalfDays = Array.isArray(employee.weeklyHalfDays) ? employee.weeklyHalfDays : [];

    let presentDays = 0;
    let lateDays = 0;
    let wfhDays = 0;
    let rosteredOffs = 0;
    let totalOffs = 0;
    let totalHalfLeaves = 0;

    for (const rec of monthAttendance) {
      let isScheduledOffDay = false;
      let isScheduledHalfDay = false;
      try {
        const [y, m, d] = rec.date.split('-').map(Number);
        const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
        isScheduledOffDay = empOffDays.includes(dayOfWeek);
        isScheduledHalfDay = empHalfDays.includes(dayOfWeek);
      } catch {}

      if (rec.workMode === 'WFH' || (rec as any).isWorkFromHome) {
        wfhDays++;
      }

      if (rec.status === 'PRESENT') {
        presentDays++;
      } else if (rec.status === 'LATE') {
        lateDays++;
        presentDays++;
      } else if (rec.status === 'HALF_LEAVE' || rec.status === 'HALF_DAY') {
        if (!isScheduledHalfDay) {
          totalHalfLeaves++;
        }
      } else if (rec.status === 'OFF' || rec.status === 'ABSENT' || rec.status === 'ON_LEAVE') {
        if (isScheduledOffDay) {
          rosteredOffs++;
        } else {
          totalOffs++;
        }
      }
    }

    const baseSalary = employee.baseSalary || 30000;
    const salaryDays = typeof settings?.salaryCalculationDays === 'number' && settings.salaryCalculationDays > 0 ? settings.salaryCalculationDays : 30;
    const dailyRate = Math.round(baseSalary / salaryDays);
    const halfDayRate = Math.round(dailyRate / 2);
    const allowedOffs = typeof settings?.allowedFreeLeaves === 'number' ? settings.allowedFreeLeaves : 1;
    const allowedHalfLeaves = typeof settings?.allowedFreeHalfLeaves === 'number' ? settings.allowedFreeHalfLeaves : 2;
    const excessOffs = Math.max(0, totalOffs - allowedOffs);
    const excessHalfLeaves = Math.max(0, totalHalfLeaves - allowedHalfLeaves);
    const offDeduction = excessOffs * dailyRate;
    const halfLeaveDeduction = excessHalfLeaves * halfDayRate;
    const leaveDeduction = offDeduction + halfLeaveDeduction;

    // Tax calculation (FBR 2026-27 Slabs / Corporate Rules)
    const taxableIncome = Math.max(0, baseSalary - leaveDeduction);
    const taxResult = resolvePayrollTax({
      monthlyTaxableIncome: taxableIncome,
      companySettings: settings as any,
      employeeTaxSettings: (employee as any).taxSettings,
    });

    const taxDeduction = taxResult.monthlyTax;
    const totalDeduction = leaveDeduction + taxDeduction;
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
        wfhDays,
        rosteredOffs,
        totalOffs,
        allowedOffs,
        excessOffs,
        totalHalfLeaves,
        allowedHalfLeaves,
        excessHalfLeaves,
        leaveDeduction,
        taxDeduction,
        taxableIncome,
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
