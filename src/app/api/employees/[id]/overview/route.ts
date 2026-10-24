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

    // Online Portal Launch Date: October 1, 2026.
    // All deductions and records prior to October were settled manually offline.
    const PORTAL_INCEPTION_DATE = '2026-10-01';
    const PORTAL_INCEPTION_YEAR = 2026;
    const PORTAL_INCEPTION_MONTH = 10;

    const effectiveStartDate = currentYear === PORTAL_INCEPTION_YEAR ? PORTAL_INCEPTION_DATE : `${currentYear}-01-01`;

    // 2. Year Attendance Records (for cumulative leave quota tracking and monthly breakdown)
    const yearAttendance = await Attendance.find({
      user: id,
      date: { $gte: effectiveStartDate, $lte: `${currentMonth}-31` },
    }).sort({ date: -1 }).lean();

    // Calculate monthly stats adhering to employee's approved weekly schedule
    const empOffDays = Array.isArray(employee.weeklyOffDays) && employee.weeklyOffDays.length > 0
      ? employee.weeklyOffDays
      : [0, 6];
    const empHalfDays = Array.isArray(employee.weeklyHalfDays) ? employee.weeklyHalfDays : [];

    // Cumulative Yearly Leave Accrual (18 annual leaves = 1.5 leaves per active month)
    // For 2026, baseline begins in October (Month 10) since prior months were settled offline.
    const joinDate = (employee as any).joinDate ? new Date((employee as any).joinDate) : null;
    const joinDateStr = (joinDate && !isNaN(joinDate.getTime()))
      ? joinDate.toISOString().substring(0, 10)
      : null;

    const baselineStartMonth = currentYear === PORTAL_INCEPTION_YEAR ? PORTAL_INCEPTION_MONTH : 1;
    let startMonth = baselineStartMonth;

    if (joinDate && !isNaN(joinDate.getTime())) {
      const joinYear = joinDate.getUTCFullYear();
      const joinMonth = joinDate.getUTCMonth() + 1;
      if (joinYear === currentYear) {
        startMonth = Math.max(baselineStartMonth, joinMonth);
      } else if (joinYear > currentYear) {
        startMonth = currentMonthNum + 1;
      }
    }
    // Dynamic Admin Policy: Allowed free full day offs and half day leaves per month
    const freeOffsPerMonth = typeof settings?.allowedFreeLeaves === 'number' ? settings.allowedFreeLeaves : 1;
    const freeHalfLeavesPerMonth = typeof settings?.allowedFreeHalfLeaves === 'number' ? settings.allowedFreeHalfLeaves : 1;
    const monthlyLeaveQuota = freeOffsPerMonth + (freeHalfLeavesPerMonth * 0.5);
    const yearlyQuota = monthlyLeaveQuota * 12;

    const activeMonthsInYear = Math.max(0, currentMonthNum - startMonth + 1);
    const cumulativeAccruedLeaves = Math.min(yearlyQuota, activeMonthsInYear * monthlyLeaveQuota);

    let presentDays = 0;
    let lateDays = 0;
    let wfhDays = 0;
    let rosteredOffs = 0;
    let concessionDays = 0;
    let totalOffs = 0;
    let totalHalfLeaves = 0;
    let pastOffsTaken = 0;
    let pastHalfLeavesTaken = 0;
    let pastLeavesTaken = 0;

    for (const rec of yearAttendance) {
      // Ignore records prior to online portal inception (2026-10-01) or joining date
      if (rec.date < PORTAL_INCEPTION_DATE) {
        continue;
      }
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
      const hasConcession = Boolean((rec as any).hasConcession);

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
            if (hasConcession) {
              concessionDays += 0.5; // Waived by Executive/CEO
            } else {
              totalHalfLeaves++;
            }
          }
        } else if (rec.status === 'OFF' || rec.status === 'ABSENT' || rec.status === 'ON_LEAVE') {
          if (isScheduledOffDay) {
            rosteredOffs++;
          } else if (hasConcession) {
            concessionDays += 1.0; // Waived by Executive/CEO
          } else {
            totalOffs++;
          }
        }
      } else {
        // Earlier month in this year
        if (rec.status === 'HALF_LEAVE' || rec.status === 'HALF_DAY') {
          if (!isScheduledHalfDay && !hasConcession) {
            pastHalfLeavesTaken += 1;
            pastLeavesTaken += 0.5;
          }
        } else if (rec.status === 'OFF' || rec.status === 'ABSENT' || rec.status === 'ON_LEAVE') {
          if (!isScheduledOffDay && !hasConcession) {
            pastOffsTaken += 1;
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
    // Directly respects dynamic admin settings for Allowed Free Offs & Allowed Free Half Leaves
    const totalCumulativeOffs = freeOffsPerMonth * activeMonthsInYear;
    const totalCumulativeHalfLeaves = freeHalfLeavesPerMonth * activeMonthsInYear;

    const allowedOffs = Math.max(0, totalCumulativeOffs - pastOffsTaken);
    const allowedHalfLeaves = Math.max(0, totalCumulativeHalfLeaves - pastHalfLeavesTaken);

    // Raw excess and unused counts before cross-category adjustment
    const rawExcessOffs = Math.max(0, totalOffs - allowedOffs);
    const rawUnusedOffs = Math.max(0, allowedOffs - totalOffs);

    const rawExcessHalfLeaves = Math.max(0, totalHalfLeaves - allowedHalfLeaves);
    const rawUnusedHalfLeaves = Math.max(0, allowedHalfLeaves - totalHalfLeaves);

    let excessOffs = rawExcessOffs;
    let excessHalfLeaves = rawExcessHalfLeaves;

    // Cross-category adjustment:
    // If employee took no/fewer half leaves than allowed, unused half leaves adjust against excess offs (1 half leave = 0.5 day credit)
    if (rawUnusedHalfLeaves > 0 && excessOffs > 0) {
      const halfLeaveCreditInDays = rawUnusedHalfLeaves * 0.5;
      const offsCovered = Math.min(excessOffs, halfLeaveCreditInDays);
      excessOffs -= offsCovered;
    }

    // If employee took fewer offs than allowed, unused offs adjust against excess half leaves (1 off = 2 half leaves credit)
    if (rawUnusedOffs > 0 && excessHalfLeaves > 0) {
      const offCreditInHalfLeaves = rawUnusedOffs * 2;
      const halfLeavesCovered = Math.min(excessHalfLeaves, offCreditInHalfLeaves);
      excessHalfLeaves -= halfLeavesCovered;
    }

    // Calculate deductions ensuring accurate rate handling for fractional excess days (e.g. 3.5 days = 3 full + 1 half)
    const fullOffsToDeduct = Math.floor(excessOffs);
    const halfOffsToDeduct = (excessOffs % 1 !== 0) ? 1 : 0;
    const offDeduction = (fullOffsToDeduct * dailyRate) + (halfOffsToDeduct * halfDayRate);
    const halfLeaveDeduction = excessHalfLeaves * halfDayRate;
    const leaveDeduction = offDeduction + halfLeaveDeduction;

    const currentMonthLeavesTaken = (totalOffs * 1.0) + (totalHalfLeaves * 0.5);
    const totalYearLeavesTaken = pastLeavesTaken + currentMonthLeavesTaken;
    const remainingLeaveBalance = Math.max(0, cumulativeAccruedLeaves - totalYearLeavesTaken);
    const excessLeaves = Math.max(0, totalYearLeavesTaken - cumulativeAccruedLeaves);
    const priorCarryForwardLeaves = Math.max(0, (Math.max(0, activeMonthsInYear - 1) * monthlyLeaveQuota) - pastLeavesTaken);
    const leaveAllowanceThisMonth = allowedOffs + (allowedHalfLeaves * 0.5);

    const isPreInceptionMonth = currentMonth < PORTAL_INCEPTION_DATE.substring(0, 7);
    const effectiveLeaveDeduction = isPreInceptionMonth ? 0 : leaveDeduction;
    const effectiveOffDeduction = isPreInceptionMonth ? 0 : offDeduction;
    const effectiveHalfLeaveDeduction = isPreInceptionMonth ? 0 : halfLeaveDeduction;

    // Tax calculation (FBR 2026-27 Slabs with 10% Pre-tax Relief on Contracted Base Salary)
    const taxableIncome = baseSalary;
    const taxResult = resolvePayrollTax({
      monthlyTaxableIncome: taxableIncome,
      companySettings: settings as any,
      employeeTaxSettings: (employee as any).taxSettings,
    });

    const taxDeduction = taxResult.monthlyTax;
    const totalDeduction = effectiveLeaveDeduction + taxDeduction;
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
        concessionDays,
        totalOffs,
        allowedOffs,
        excessOffs,
        totalHalfLeaves,
        allowedHalfLeaves,
        excessHalfLeaves,
        yearlyQuota,
        cumulativeAccruedLeaves,
        priorCarryForwardLeaves,
        leaveAllowanceThisMonth,
        currentMonthLeavesTaken,
        totalYearLeavesTaken,
        excessLeaves,
        remainingLeaveBalance,
        offDeduction: effectiveOffDeduction,
        halfLeaveDeduction: effectiveHalfLeaveDeduction,
        leaveDeduction: effectiveLeaveDeduction,
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
