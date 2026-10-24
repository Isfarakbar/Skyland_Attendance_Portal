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

    const [yearStr, monthNumStr] = currentMonth.split('-');
    const currentYear = parseInt(yearStr);
    const currentMonthNum = parseInt(monthNumStr);

    // 1. Today's Attendance
    const todayAttendance = await Attendance.findOne({ user: id, date: todayDate }).lean();

    // 2. Year Attendance Records (for cumulative leave quota tracking and monthly breakdown)
    const yearAttendance = await Attendance.find({
      user: id,
      date: { $gte: `${currentYear}-01-01`, $lte: `${currentMonth}-31` },
    }).sort({ date: -1 }).lean();

    // Calculate monthly stats adhering to employee's approved weekly schedule
    const empOffDays = Array.isArray(employee.weeklyOffDays) && employee.weeklyOffDays.length > 0
      ? employee.weeklyOffDays
      : [0, 6];
    const empHalfDays = Array.isArray(employee.weeklyHalfDays) ? employee.weeklyHalfDays : [];

    // Cumulative Yearly Leave Accrual (18 annual leaves = 1.5 leaves per month)
    const joinDate = (employee as any).joinDate ? new Date((employee as any).joinDate) : null;
    const joinDateStr = (joinDate && !isNaN(joinDate.getTime()))
      ? joinDate.toISOString().substring(0, 10)
      : null;

    let startMonth = 1;
    if (joinDate && !isNaN(joinDate.getTime()) && joinDate.getUTCFullYear() === currentYear) {
      startMonth = joinDate.getUTCMonth() + 1;
    } else if (joinDate && !isNaN(joinDate.getTime()) && joinDate.getUTCFullYear() > currentYear) {
      startMonth = currentMonthNum + 1;
    }
    const activeMonthsInYear = Math.max(0, currentMonthNum - startMonth + 1);
    const cumulativeAccruedLeaves = Math.min(18, activeMonthsInYear * 1.5);

    let presentDays = 0;
    let lateDays = 0;
    let wfhDays = 0;
    let rosteredOffs = 0;
    let totalOffs = 0;
    let totalHalfLeaves = 0;
    let pastLeavesTaken = 0;

    for (const rec of yearAttendance) {
      // Attendance logs prior to employee's official joining date are ignored
      if (joinDateStr && rec.date < joinDateStr) {
        continue;
      }

      let isScheduledOffDay = false;
      let isScheduledHalfDay = false;
      try {
        const [y, m, d] = rec.date.split('-').map(Number);
        const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
        isScheduledOffDay = empOffDays.includes(dayOfWeek);
        isScheduledHalfDay = empHalfDays.includes(dayOfWeek);
      } catch {}

      const isCurrentMonth = rec.date.startsWith(currentMonth);

      if (isCurrentMonth) {
        if (rec.workMode === 'WFH' || (rec as any).isWorkFromHome || rec.status === 'WFH') {
          wfhDays++;
        }

        if (rec.status === 'PRESENT' || rec.status === 'WFH') {
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
      } else {
        // Earlier month in this year
        if (rec.status === 'HALF_LEAVE' || rec.status === 'HALF_DAY') {
          if (!isScheduledHalfDay) {
            pastLeavesTaken += 0.5;
          }
        } else if (rec.status === 'OFF' || rec.status === 'ABSENT' || rec.status === 'ON_LEAVE') {
          if (!isScheduledOffDay) {
            pastLeavesTaken += 1.0;
          }
        }
      }
    }

    const baseSalary = employee.baseSalary || 30000;
    const salaryDays = typeof settings?.salaryCalculationDays === 'number' && settings.salaryCalculationDays > 0 ? settings.salaryCalculationDays : 30;
    const dailyRate = Math.round(baseSalary / salaryDays);
    const halfDayRate = Math.round(dailyRate / 2);

    // Cumulative Leave Quota & Carry-Forward Calculations
    const currentMonthLeavesTaken = (totalOffs * 1.0) + (totalHalfLeaves * 0.5);
    const totalYearLeavesTaken = pastLeavesTaken + currentMonthLeavesTaken;

    const priorCarryForwardLeaves = Math.max(0, (Math.max(0, activeMonthsInYear - 1) * 1.5) - pastLeavesTaken);
    const leaveAllowanceThisMonth = Math.max(0, cumulativeAccruedLeaves - pastLeavesTaken);

    const excessLeaves = Math.max(0, totalYearLeavesTaken - cumulativeAccruedLeaves);
    const leaveDeduction = Math.round(excessLeaves * dailyRate);
    const remainingLeaveBalance = Math.max(0, cumulativeAccruedLeaves - totalYearLeavesTaken);

    const excessOffs = Math.floor(excessLeaves);
    const excessHalfLeaves = (excessLeaves % 1 !== 0) ? 1 : 0;
    const offDeduction = excessOffs * dailyRate;
    const halfLeaveDeduction = excessHalfLeaves * halfDayRate;

    // Tax calculation (FBR 2026-27 Slabs with 10% Pre-tax Relief on Contracted Base Salary)
    const taxableIncome = baseSalary;
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
        allowedOffs: leaveAllowanceThisMonth,
        excessOffs,
        totalHalfLeaves,
        allowedHalfLeaves: Math.max(0, leaveAllowanceThisMonth * 2),
        excessHalfLeaves,
        yearlyQuota: 18,
        cumulativeAccruedLeaves,
        priorCarryForwardLeaves,
        leaveAllowanceThisMonth,
        currentMonthLeavesTaken,
        totalYearLeavesTaken,
        excessLeaves,
        remainingLeaveBalance,
        offDeduction,
        halfLeaveDeduction,
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
