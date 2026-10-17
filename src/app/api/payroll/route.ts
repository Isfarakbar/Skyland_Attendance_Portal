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
  baseSalary: number;
  dailyRate: number;
  halfDayRate: number;
  presentDays: number;
  lateDays: number;
  totalOffs: number;
  allowedOffs: number;
  excessOffs: number;
  totalHalfLeaves: number;
  allowedHalfLeaves: number;
  excessHalfLeaves: number;
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
      .select('_id name email employeeId department designation baseSalary role taxSettings')
      .sort({ name: 1 })
      .lean();

    // Fetch attendance for the month
    // Month regex: e.g. "^2026-03"
    const attendanceRecords = await Attendance.find({
      date: { $regex: `^${month}` },
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

      let presentDays = 0;
      let lateDays = 0;
      let totalOffs = 0;
      let totalHalfLeaves = 0;

      for (const rec of userAtt) {
        if (rec.status === 'PRESENT') {
          presentDays++;
        } else if (rec.status === 'LATE') {
          lateDays++;
          presentDays++; // Present, but recorded as late (record only, no penalty)
        } else if (rec.status === 'HALF_LEAVE' || rec.status === 'HALF_DAY') {
          totalHalfLeaves++;
        } else if (rec.status === 'OFF' || rec.status === 'ABSENT' || rec.status === 'ON_LEAVE') {
          totalOffs++;
        }
      }

      const baseSalary = typeof emp.baseSalary === 'number' && emp.baseSalary > 0 ? emp.baseSalary : 30000;
      const salaryDays = typeof settings?.salaryCalculationDays === 'number' && settings.salaryCalculationDays > 0 ? settings.salaryCalculationDays : 30;
      const dailyRate = Math.round(baseSalary / salaryDays);
      const halfDayRate = Math.round(dailyRate / 2);

      // Office policy: allowed free leaves/half leaves from settings (defaults: 1 off, 2 half leaves)
      const allowedOffs = typeof settings?.allowedFreeLeaves === 'number' ? settings.allowedFreeLeaves : 1;
      const allowedHalfLeaves = typeof settings?.allowedFreeHalfLeaves === 'number' ? settings.allowedFreeHalfLeaves : 2;

      const excessOffs = Math.max(0, totalOffs - allowedOffs);
      const excessHalfLeaves = Math.max(0, totalHalfLeaves - allowedHalfLeaves);

      const offDeduction = excessOffs * dailyRate;
      const halfLeaveDeduction = excessHalfLeaves * halfDayRate;
      const leaveDeduction = offDeduction + halfLeaveDeduction;

      // Tax Calculation (FBR 2026-27 Slabs / Corporate Rules)
      const taxableIncome = Math.max(0, baseSalary - leaveDeduction);
      const taxResult = resolvePayrollTax({
        monthlyTaxableIncome: taxableIncome,
        companySettings: settings as any,
        employeeTaxSettings: (emp as any).taxSettings,
      });

      const taxDeduction = taxResult.monthlyTax;
      const totalDeduction = leaveDeduction + taxDeduction;
      const netSalary = Math.max(0, baseSalary - totalDeduction);

      return {
        userId: String(emp._id),
        name: emp.name,
        employeeId: emp.employeeId,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        baseSalary,
        dailyRate,
        halfDayRate,
        presentDays,
        lateDays,
        totalOffs,
        allowedOffs,
        excessOffs,
        totalHalfLeaves,
        allowedHalfLeaves,
        excessHalfLeaves,
        offDeduction,
        halfLeaveDeduction,
        leaveDeduction,
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
