import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, DEFAULT_TIMEZONE, isValidMonthParam } from '@/lib/attendanceUtils';
import { resolvePayrollTax } from '@/lib/taxCalculator';
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
    const rawMonth = searchParams.get('month');
    const month = rawMonth && isValidMonthParam(rawMonth) ? rawMonth : currentMonthStr;
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
      .select('_id name email employeeId department designation baseSalary role taxSettings bankName accountNumber iban cnic joinDate workMode weeklyOffDays weeklyHalfDays')
      .sort({ name: 1 })
      .lean();

    const [yearStr, monthNumStr] = month.split('-');
    const currentYear = parseInt(yearStr);
    const currentMonthNum = parseInt(monthNumStr);

    const attendanceRecords = await Attendance.find({
      date: { $gte: `${currentYear}-01-01`, $lte: `${month}-31` },
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

      // Determine employee's approved weekly off days & half days
      const empOffDays = Array.isArray((emp as any).weeklyOffDays) && (emp as any).weeklyOffDays.length > 0
        ? (emp as any).weeklyOffDays
        : [0, 6]; // Default: Sunday (0) and Saturday (6)
      const empHalfDays = Array.isArray((emp as any).weeklyHalfDays)
        ? (emp as any).weeklyHalfDays
        : [];

      // Cumulative Yearly Leave Accrual (18 annual leaves = 1.5 leaves per month)
      const joinDate = (emp as any).joinDate ? new Date((emp as any).joinDate) : null;
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
      let totalOffs = 0;
      let totalHalfLeaves = 0;
      let rosteredOffs = 0;
      let wfhDays = 0;
      let pastLeavesTaken = 0;

      for (const rec of userAtt) {
        const dateParts = rec.date.split('-').map(Number);
        const dayOfWeek = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])).getUTCDay();
        const isScheduledOff = empOffDays.includes(dayOfWeek);
        const isScheduledHalfDay = empHalfDays.includes(dayOfWeek);
        const isCurrentMonth = rec.date.startsWith(month);

        if (isCurrentMonth) {
          if (rec.workMode === 'WFH' || (rec as any).isWorkFromHome) {
            wfhDays++;
          }

          if (rec.status === 'PRESENT') {
            presentDays++;
          } else if (rec.status === 'LATE') {
            lateDays++;
            presentDays++; // Present, recorded as late (record only, zero penalty)
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
          // Earlier month in this year
          if (rec.status === 'HALF_LEAVE' || rec.status === 'HALF_DAY') {
            if (!isScheduledHalfDay) {
              pastLeavesTaken += 0.5;
            }
          } else if (rec.status === 'OFF' || rec.status === 'ABSENT' || rec.status === 'ON_LEAVE') {
            if (!isScheduledOff) {
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
      const currentMonthLeavesTaken = (totalOffs * 1.0) + (totalHalfLeaves * 0.5);
      const totalYearLeavesTaken = pastLeavesTaken + currentMonthLeavesTaken;

      const priorCarryForwardLeaves = Math.max(0, (Math.max(0, activeMonthsInYear - 1) * 1.5) - pastLeavesTaken);
      const leaveAllowanceThisMonth = Math.max(0, cumulativeAccruedLeaves - pastLeavesTaken);

      const excessLeaves = Math.max(0, totalYearLeavesTaken - cumulativeAccruedLeaves);
      const leaveDeduction = Math.round(excessLeaves * dailyRate);
      const remainingLeaveBalance = Math.max(0, cumulativeAccruedLeaves - totalYearLeavesTaken);

      const excessOffs = Math.floor(excessLeaves);
      const excessHalfLeaves = (excessLeaves % 1 !== 0) ? 1 : 0;

      // Tax calculation (FBR 2026-27 Slabs with 10% Pre-tax Relief)
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
        'Employee ID': emp.employeeId,
        'Full Name': emp.name,
        'Department': emp.department,
        'Designation': emp.designation,
        'Base Salary (PKR)': baseSalary,
        'Present Days': presentDays,
        'Late Arrivals (Count)': lateDays,
        'Total Offs': totalOffs,
        'Allowed Offs (Free)': leaveAllowanceThisMonth,
        'Excess Offs': excessOffs,
        'Total Half Leaves': totalHalfLeaves,
        'Allowed Half Leaves (Free)': Math.max(0, leaveAllowanceThisMonth * 2),
        'Excess Half Leaves': excessHalfLeaves,
        'Annual Leave Balance': remainingLeaveBalance,
        'Cumulative Accrued Leaves': cumulativeAccruedLeaves,
        'Daily Rate (PKR)': dailyRate,
        'Leave Deductions (PKR)': leaveDeduction,
        'Taxable Income (PKR)': taxableIncome,
        'Annualized Taxable (PKR)': taxResult.annualTax ? Math.round(taxableIncome * 12) : 0,
        'Applicable Tax Slab': taxResult.applicableSlabNumber ? `Slab ${taxResult.applicableSlabNumber} (${(taxResult.marginalRate * 100).toFixed(0)}%)` : (taxResult.taxModeUsed === 'EXEMPT' ? 'Exempt (0%)' : 'Tax-Free / N/A'),
        'Annual Income Tax (PKR)': taxResult.annualTax,
        'Monthly Tax Withheld (PKR)': taxDeduction,
        'Total Deductions (PKR)': totalDeduction,
        'Net Take-Home Pay (PKR)': netSalary,
        'WFH Days': wfhDays,
        'Rostered Offs': rosteredOffs,
      };
    });

    const wb = XLSX.utils.book_new();

    // Default column widths for tabular salary sheet
    const summaryColWidths = [
      { wch: 15 }, // Employee ID
      { wch: 24 }, // Full Name
      { wch: 24 }, // Department
      { wch: 22 }, // Designation
      { wch: 18 }, // Base Salary (PKR)
      { wch: 14 }, // Present Days
      { wch: 22 }, // Late Arrivals (Count)
      { wch: 14 }, // Total Offs
      { wch: 20 }, // Allowed Offs (Free)
      { wch: 14 }, // Excess Offs
      { wch: 18 }, // Total Half Leaves
      { wch: 24 }, // Allowed Half Leaves (Free)
      { wch: 18 }, // Excess Half Leaves
      { wch: 16 }, // Daily Rate (PKR)
      { wch: 22 }, // Leave Deductions (PKR)
      { wch: 22 }, // Taxable Income (PKR)
      { wch: 24 }, // Annualized Taxable (PKR)
      { wch: 24 }, // Applicable Tax Slab
      { wch: 24 }, // Annual Income Tax (PKR)
      { wch: 24 }, // Monthly Tax Withheld (PKR)
      { wch: 22 }, // Total Deductions (PKR)
      { wch: 24 }, // Net Take-Home Pay (PKR)
    ];

    // If exporting for a single employee, generate an executive Corporate Payslip Dossier as Sheet 1
    if (targetUserId && employees.length === 1) {
      const emp = employees[0];
      const p = payrollRows[0];
      const salaryDays = typeof settings?.salaryCalculationDays === 'number' && settings.salaryCalculationDays > 0 ? settings.salaryCalculationDays : 30;
      const monthParts = month.split('-');
      const monthDate = new Date(parseInt(monthParts[0]), parseInt(monthParts[1]) - 1, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const joinDateStr = (emp as any).joinDate
        ? new Date((emp as any).joinDate).toLocaleDateString('en-GB')
        : 'N/A';
      const empOffDays: number[] = Array.isArray((emp as any).weeklyOffDays) && (emp as any).weeklyOffDays.length > 0
        ? (emp as any).weeklyOffDays
        : [0, 6];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const offDaysStr = empOffDays.map((d: number) => dayNames[d] || d).join(', ') || 'Sun';
      const workModeStr = (emp as any).workMode === 'WFH'
        ? 'Work From Home'
        : ((emp as any).workMode === 'FIELD' ? 'Field / On-Site' : 'In-Office');
      const wfhDays = p['WFH Days'] ?? 0;
      const rosteredOffs = p['Rostered Offs'] ?? 0;

      // Structured official payslip layout
      const payslipSheetData: (string | number)[][] = [
        ['SKYLAND ENERGY (PVT) LIMITED'],
        ['OFFICIAL MONTHLY SALARY PAYSLIP'],
        [`Pay Period: ${monthName} | Generated: ${new Date().toLocaleDateString('en-GB')}`],
        [''],
        ['EMPLOYEE INFORMATION', '', 'BANKING & DISBURSEMENT', ''],
        ['Employee ID:', p['Employee ID'], 'Bank Name:', (emp as any).bankName || 'Standard Chartered'],
        ['Employee Name:', p['Full Name'], 'Account Number:', (emp as any).accountNumber ? `••••${String((emp as any).accountNumber).slice(-4)}` : 'On File'],
        ['Department:', p['Department'], 'IBAN:', (emp as any).iban || 'On File'],
        ['Designation:', p['Designation'], 'Payment Mode:', 'Direct Bank Transfer / Auto-Credit'],
        ['Joining Date:', joinDateStr, 'Primary Work Mode:', workModeStr],
        ['Email:', emp.email, 'Currency:', 'PKR (Pakistani Rupee)'],
        [''],
        ['ATTENDANCE & TIME REGISTER', '', 'LEAVE & ROSTER POLICY METRICS', ''],
        ['Salary Divisor Days:', salaryDays, 'Free Offs Allowed:', p['Allowed Offs (Free)']],
        ['Present Days:', p['Present Days'], 'Weekly Off Days (Approved):', offDaysStr],
        ['WFH Days (Remote):', wfhDays, 'Approved Weekly Offs Taken:', `${rosteredOffs} (No Deduction)`],
        ['Late Arrivals (Count):', `${p['Late Arrivals (Count)']} (No Penalty)`, 'Excess Offs (Deducted):', p['Excess Offs']],
        ['Free Half Leaves Allowed:', p['Allowed Half Leaves (Free)'], 'Total Half Leaves Taken:', p['Total Half Leaves']],
        ['Excess Half Leaves (Deducted):', p['Excess Half Leaves'], 'Daily Wage Divisor Rate:', `PKR ${p['Daily Rate (PKR)']}`],
        [''],
        ['ITEMIZED EARNINGS & DEDUCTIONS BREAKDOWN', '', '', ''],
        ['Line Item Component', 'Category', 'Calculation / Policy Basis', 'Amount (PKR)'],
        ['Basic Monthly Salary', 'Earnings', 'Contracted Monthly Base Wage', p['Base Salary (PKR)']],
        ['Gross Earnings Subtotal', 'Earnings', 'Base contracted remuneration', p['Base Salary (PKR)']],
        ['Excess Unpaid Offs Deduction', 'Deductions', `${p['Excess Offs']} excess off(s) × PKR ${p['Daily Rate (PKR)']}`, p['Excess Offs'] * p['Daily Rate (PKR)']],
        ['Excess Half Leaves Deduction', 'Deductions', `${p['Excess Half Leaves']} excess half leave(s) × PKR ${Math.round(p['Daily Rate (PKR)'] / 2)}`, p['Excess Half Leaves'] * Math.round(p['Daily Rate (PKR)'] / 2)],
        ['Total Attendance Deductions', 'Deductions', 'Offs & Half Leaves exceeding free quota', p['Leave Deductions (PKR)']],
        ['FBR Income Tax Withholding', 'Deductions', String(p['Applicable Tax Slab']), p['Monthly Tax Withheld (PKR)']],
        ['Total Deductions Subtotal', 'Deductions', 'Attendance fines + Income Tax', p['Total Deductions (PKR)']],
        [''],
        ['FINAL REMUNERATION', '', '', ''],
        ['NET TAKE-HOME SALARY PAYABLE', 'NET PAY', 'Gross Earnings - Total Deductions', p['Net Take-Home Pay (PKR)']],
        [''],
        ['CONFIDENTIALITY & AUDIT NOTICE:'],
        ['This salary slip is computer-generated by Skyland Energy Portal and serves as an official receipt of monthly remuneration.'],
        ['All calculations adhere strictly to company HR policy: 18 annual leaves (1 full day & 1 half leave per month carry-forward), 10% salary pre-tax relief with FBR tax slabs, and zero financial penalty for late arrivals.'],
      ];

      const wsPayslip = XLSX.utils.aoa_to_sheet(payslipSheetData);
      wsPayslip['!cols'] = [
        { wch: 32 },
        { wch: 28 },
        { wch: 42 },
        { wch: 22 },
      ];
      XLSX.utils.book_append_sheet(wb, wsPayslip, 'Official Payslip');

      // Sheet 2: Daily Attendance Log
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
          'Work Mode': (att.workMode === 'WFH' || (att as any).isWorkFromHome) ? 'Work From Home' : 'Office/On-Site',
          'Time In': inTime,
          'Time Out': outTime,
          'Work Duration (Mins)': att.totalWorkMinutes || 0,
          'Notes': att.notes || '',
        };
      });

      const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
      wsDaily['!cols'] = [
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 24 },
        { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Attendance Log');

      // Sheet 3: Structured Ledger Data
      const wsSummary = XLSX.utils.json_to_sheet(payrollRows);
      wsSummary['!cols'] = summaryColWidths;
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ledger Data');
    } else {
      // Company-wide export: Summary sheet with auto-sized columns
      const wsSummary = XLSX.utils.json_to_sheet(payrollRows);
      wsSummary['!cols'] = summaryColWidths;
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Salary Sheet');
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
