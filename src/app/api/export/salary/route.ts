import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, DEFAULT_TIMEZONE } from '@/lib/attendanceUtils';
import * as XLSX from 'xlsx';

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
    const currentMonthStr = getTodayDateString(new Date(), timezone).substring(0, 7);
    const month = searchParams.get('month') || currentMonthStr;
    const requestedUserId = searchParams.get('userId');

    const isManagement = ['developer', 'admin', 'ceo', 'manager'].includes(session.role);

    // If regular employee, only allow self export
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

    const attendanceRecords = await Attendance.find({
      date: { $regex: `^${month}` },
      ...(targetUserId ? { user: targetUserId } : {}),
    }).sort({ date: 1 }).lean();

    const recordsByUser = new Map<string, typeof attendanceRecords>();
    for (const record of attendanceRecords) {
      const uId = String(record.user);
      if (!recordsByUser.has(uId)) {
        recordsByUser.set(uId, []);
      }
      recordsByUser.get(uId)!.push(record);
    }

    const payrollRows = employees.map((emp) => {
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
          presentDays++;
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

      const allowedOffs = typeof settings?.allowedFreeLeaves === 'number' ? settings.allowedFreeLeaves : 1;
      const allowedHalfLeaves = typeof settings?.allowedFreeHalfLeaves === 'number' ? settings.allowedFreeHalfLeaves : 2;

      const excessOffs = Math.max(0, totalOffs - allowedOffs);
      const excessHalfLeaves = Math.max(0, totalHalfLeaves - allowedHalfLeaves);

      const offDeduction = excessOffs * dailyRate;
      const halfLeaveDeduction = excessHalfLeaves * halfDayRate;
      const leaveDeduction = offDeduction + halfLeaveDeduction;

      // Tax calculation
      const taxableIncome = Math.max(0, baseSalary - leaveDeduction);
      let taxDeduction = 0;
      const userTax = (emp as any).taxSettings;

      if (userTax?.isExempt) {
        taxDeduction = 0;
      } else if (typeof userTax?.customFixedAmount === 'number' && userTax.customFixedAmount >= 0) {
        taxDeduction = userTax.customFixedAmount;
      } else if (typeof userTax?.customRate === 'number' && userTax.customRate >= 0) {
        const threshold = typeof settings?.taxExemptionThreshold === 'number' ? settings.taxExemptionThreshold : 50000;
        const taxableOverThreshold = Math.max(0, taxableIncome - threshold);
        taxDeduction = Math.round((taxableOverThreshold * userTax.customRate) / 100);
      } else if (settings?.taxDeductionEnabled) {
        const threshold = typeof settings?.taxExemptionThreshold === 'number' ? settings.taxExemptionThreshold : 50000;
        const rate = typeof settings?.taxRate === 'number' ? settings.taxRate : 2.5;
        const taxableOverThreshold = Math.max(0, taxableIncome - threshold);
        taxDeduction = Math.round((taxableOverThreshold * rate) / 100);
      }

      const totalDeduction = leaveDeduction + taxDeduction;
      const netSalary = Math.max(0, baseSalary - totalDeduction);

      return {
        'Employee ID': emp.employeeId,
        'Full Name': emp.name,
        'Department': emp.department,
        'Designation': emp.designation,
        'Base Salary (PKR)': baseSalary,
        'Present Days': presentDays,
        'Late Arrivals (Count)': lateDays,
        'Total Offs': totalOffs,
        'Allowed Offs (Free)': allowedOffs,
        'Excess Offs': excessOffs,
        'Total Half Leaves': totalHalfLeaves,
        'Allowed Half Leaves (Free)': allowedHalfLeaves,
        'Excess Half Leaves': excessHalfLeaves,
        'Daily Rate (PKR)': dailyRate,
        'Leave Deductions (PKR)': leaveDeduction,
        'Taxable Income (PKR)': taxableIncome,
        'Tax Withheld (PKR)': taxDeduction,
        'Total Deductions (PKR)': totalDeduction,
        'Net Take-Home Pay (PKR)': netSalary,
      };
    });

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const wsSummary = XLSX.utils.json_to_sheet(payrollRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Salary Sheet');

    // If exporting for a single employee, add a second sheet with daily attendance log
    if (targetUserId && employees.length === 1) {
      const emp = employees[0];
      const userAtt = recordsByUser.get(String(emp._id)) || [];

      const dailyRows = userAtt.map((att) => {
        let inTime = '';
        let outTime = '';
        if (att.clockIn) {
          try {
            inTime = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }).format(new Date(att.clockIn));
          } catch {
            inTime = '';
          }
        }
        if (att.clockOut) {
          try {
            outTime = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }).format(new Date(att.clockOut));
          } catch {
            outTime = '';
          }
        }

        return {
          'Date': att.date,
          'Status': att.status,
          'Time In': inTime,
          'Time Out': outTime,
          'Work Duration (Mins)': att.totalWorkMinutes || 0,
          'Notes': att.notes || '',
        };
      });

      const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Attendance Log');
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const fileName = targetUserId && employees.length === 1
      ? `Salary_${employees[0].name.replace(/\s+/g, '_')}_${month}.xlsx`
      : `Skyland_Salary_Sheet_${month}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error exporting salary sheet';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
