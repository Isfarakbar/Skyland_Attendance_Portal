import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, DEFAULT_TIMEZONE, isValidMonthParam } from '@/lib/attendanceUtils';
import { resolvePayrollTax } from '@/lib/taxCalculator';

export interface PayrollRecord {
  userId: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  designation: string;
  workMode?: string;
  weeklyOffDays?: number[];
  weeklyHalfDays?: number[];
  joinDate?: Date | string;
  baseSalary: number;
  dailyRate: number;
  halfDayRate: number;
  presentDays: number;
  lateDays: number;
  wfhDays?: number;
  rosteredOffs?: number;
  totalOffs: number;
  allowedOffs: number;
  excessOffs: number;
  totalHalfLeaves: number;
  allowedHalfLeaves: number;
  excessHalfLeaves: number;
  yearlyQuota: number;
  cumulativeAccruedLeaves: number;
  priorCarryForwardLeaves: number;
  leaveAllowanceThisMonth: number;
  currentMonthLeavesTaken: number;
  totalYearLeavesTaken: number;
  excessLeaves: number;
  remainingLeaveBalance: number;
  offDeduction: number;
  halfLeaveDeduction: number;
  leaveDeduction: number;
  taxableIncome: number;
  taxDeduction: number;
  taxSlab?: number | null;
  taxModeUsed?: string;
  taxDescription?: string;
  totalDeduction: number;
  netSalary: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const settings = await CompanySettings.findOne().lean();
    const timezone = settings?.timezone || DEFAULT_TIMEZONE;
    const currentMonthStr = getTodayDateString(new Date(), timezone).substring(0, 7); // "YYYY-MM"
    const rawMonth = searchParams.get('month');
    const month = rawMonth && isValidMonthParam(rawMonth) ? rawMonth : currentMonthStr;
    const requestedUserId = searchParams.get('userId');

    const isManagement = ['developer', 'admin', 'ceo', 'manager'].includes(session.role);

    // If regular employee, only allow self lookup
    if (!isManagement && requestedUserId && requestedUserId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = !isManagement ? session.userId : (requestedUserId || null);

    const userQuery: Record<string, unknown> = { isActive: true };
    if (targetUserId) {
      userQuery._id = targetUserId;
    } else {
      userQuery.role = { $nin: ['admin', 'developer', 'ceo'] };
    }

    const employees = await User.find(userQuery)
      .select('_id name email employeeId department designation baseSalary role taxSettings workMode weeklyOffDays weeklyHalfDays joinDate')
      .lean();

    const registerOrder: string[] = (settings as any)?.deskRegisterOrder || [];
    const orderMap = new Map(registerOrder.map((id: string, idx: number) => [String(id), idx]));

    employees.sort((a, b) => {
      const idA = String(a._id);
      const idB = String(b._id);
      const hasA = orderMap.has(idA);
      const hasB = orderMap.has(idB);
      if (hasA && hasB) return orderMap.get(idA)! - orderMap.get(idB)!;
      if (hasA) return -1;
      if (hasB) return 1;
      return a.name.localeCompare(b.name);
    });

    const [yearStr, monthNumStr] = month.split('-');
    const currentYear = parseInt(yearStr);
    const currentMonthNum = parseInt(monthNumStr);

    // Online Portal Launch Date: October 1, 2026.
    // All deductions and records prior to October were settled manually offline.
    const PORTAL_INCEPTION_DATE = '2026-10-01';
    const PORTAL_INCEPTION_YEAR = 2026;
    const PORTAL_INCEPTION_MONTH = 10;

    const effectiveStartDate = currentYear === PORTAL_INCEPTION_YEAR ? PORTAL_INCEPTION_DATE : `${currentYear}-01-01`;

    // Fetch attendance from inception (or year start for future years) up to the end of target month
    const attendanceRecords = await Attendance.find({
      date: { $gte: effectiveStartDate, $lte: `${month}-31` },
      ...(targetUserId ? { user: targetUserId } : {}),
    }).lean();

    // Group records by user
    const recordsByUser = new Map<string, typeof attendanceRecords>();
    for (const record of attendanceRecords) {
      const uId = String(record.user);
      if (!recordsByUser.has(uId)) {
        recordsByUser.set(uId, []);
      }
      recordsByUser.get(uId)!.push(record);
    }

    const payrollList: PayrollRecord[] = employees.map((emp) => {
      const userAtt = recordsByUser.get(String(emp._id)) || [];

      // Determine employee's approved weekly off days & half days
      const empOffDays = Array.isArray((emp as any).weeklyOffDays) && (emp as any).weeklyOffDays.length > 0
        ? (emp as any).weeklyOffDays
        : [0, 6]; // Default: Sunday (0) and Saturday (6)
      const empHalfDays = Array.isArray((emp as any).weeklyHalfDays)
        ? (emp as any).weeklyHalfDays
        : [];

      // Cumulative Yearly Leave Accrual (18 annual leaves = 1.5 leaves per active month)
      // For 2026, baseline begins in October (Month 10) since prior months were settled offline.
      const joinDate = (emp as any).joinDate ? new Date((emp as any).joinDate) : null;
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
          startMonth = currentMonthNum + 1; // Future hire
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
      let totalOffs = 0;
      let totalHalfLeaves = 0;
      let rosteredOffs = 0;
      let wfhDays = 0;
      let pastOffsTaken = 0;
      let pastHalfLeavesTaken = 0;
      let pastLeavesTaken = 0;

      for (const rec of userAtt) {
        // Ignore any records prior to portal inception or employee's official joining date
        if (rec.date < PORTAL_INCEPTION_DATE) {
          continue;
        }
        if (joinDateStr && rec.date < joinDateStr) {
          continue;
        }

        const dateParts = rec.date.split('-').map(Number);
        const dayOfWeek = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])).getUTCDay();
        const isScheduledOff = empOffDays.includes(dayOfWeek);
        const isScheduledHalfDay = empHalfDays.includes(dayOfWeek);
        const isCurrentMonth = rec.date.startsWith(month);

        if (isCurrentMonth) {
          if (rec.workMode === 'WFH' || (rec as any).isWorkFromHome || rec.status === 'WFH') {
            wfhDays++;
          }

          if (rec.status === 'PRESENT' || rec.status === 'WFH') {
            presentDays++;
          } else if (rec.status === 'LATE') {
            lateDays++;
            presentDays++; // Present, recorded as late (no financial penalty)
          } else if (rec.status === 'HALF_LEAVE' || rec.status === 'HALF_DAY') {
            if (!isScheduledHalfDay) {
              totalHalfLeaves++;
            }
          } else if (rec.status === 'OFF' || rec.status === 'ABSENT' || rec.status === 'ON_LEAVE') {
            if (isScheduledOff) {
              rosteredOffs++;
            } else {
              totalOffs++;
            }
          }
        } else {
          // Record belongs to an earlier month in the current portal period
          if (rec.status === 'HALF_LEAVE' || rec.status === 'HALF_DAY') {
            if (!isScheduledHalfDay) {
              pastHalfLeavesTaken += 1;
              pastLeavesTaken += 0.5;
            }
          } else if (rec.status === 'OFF' || rec.status === 'ABSENT' || rec.status === 'ON_LEAVE') {
            if (!isScheduledOff) {
              pastOffsTaken += 1;
              pastLeavesTaken += 1.0;
            }
          }
        }
      }

      const baseSalary = typeof emp.baseSalary === 'number' && emp.baseSalary > 0 ? emp.baseSalary : 30000;
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

      // Prior to October 2026, all deductions were settled manually offline.
      const isPreInceptionMonth = month < PORTAL_INCEPTION_DATE.substring(0, 7);
      const effectiveLeaveDeduction = isPreInceptionMonth ? 0 : leaveDeduction;
      const effectiveOffDeduction = isPreInceptionMonth ? 0 : offDeduction;
      const effectiveHalfLeaveDeduction = isPreInceptionMonth ? 0 : halfLeaveDeduction;

      // Tax Calculation (FBR 2026-27 Slabs with 10% Pre-tax Relief on Contracted Base Salary)
      const taxableIncome = baseSalary;
      const taxResult = resolvePayrollTax({
        monthlyTaxableIncome: taxableIncome,
        companySettings: settings as any,
        employeeTaxSettings: (emp as any).taxSettings,
      });

      const taxDeduction = taxResult.monthlyTax;
      const totalDeduction = effectiveLeaveDeduction + taxDeduction;
      const netSalary = Math.max(0, baseSalary - totalDeduction);

      return {
        userId: String(emp._id),
        name: emp.name,
        employeeId: emp.employeeId,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        workMode: (emp as any).workMode || 'OFFICE',
        weeklyOffDays: empOffDays,
        weeklyHalfDays: empHalfDays,
        joinDate: (emp as any).joinDate,
        baseSalary,
        dailyRate,
        halfDayRate,
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
        taxableIncome,
        taxDeduction,
        taxSlab: taxResult.applicableSlabNumber,
        taxModeUsed: taxResult.taxModeUsed,
        taxDescription: taxResult.description,
        totalDeduction,
        netSalary,
      };
    });

    const totalPayroll = payrollList.reduce((sum, p) => sum + p.netSalary, 0);
    const totalDeductions = payrollList.reduce((sum, p) => sum + p.totalDeduction, 0);
    const totalLeaveDeductions = payrollList.reduce((sum, p) => sum + p.leaveDeduction, 0);
    const totalTaxDeductions = payrollList.reduce((sum, p) => sum + p.taxDeduction, 0);
    const totalBaseSalary = payrollList.reduce((sum, p) => sum + p.baseSalary, 0);

    return NextResponse.json({
      success: true,
      month,
      summary: {
        totalEmployees: payrollList.length,
        totalBaseSalary,
        totalLeaveDeductions,
        totalTaxDeductions,
        totalDeductions,
        totalPayroll,
      },
      payroll: payrollList,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error calculating payroll';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
