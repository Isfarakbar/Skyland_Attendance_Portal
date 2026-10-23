'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, DollarSign, Calendar, Search, AlertCircle, ArrowDownRight, User, Eye, EyeOff, Printer, FileText, X } from 'lucide-react';
import { PayrollRecord } from '@/app/api/payroll/route';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatOffDays(days?: number[]): string {
  if (!days || days.length === 0) return 'None';
  return days.map((d) => DAY_NAMES[d] || `Day ${d}`).join(', ');
}

function formatJoiningDate(date?: Date | string): string {
  if (!date) return 'Not set';
  const d = new Date(date);
  return isNaN(d.getTime()) ? 'Not set' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface SalarySheetProps {
  isEmployeeOnly?: boolean;
  userId?: string;
}

export default function SalarySheet({ isEmployeeOnly = false, userId }: SalarySheetProps) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return today.toISOString().substring(0, 7); // "YYYY-MM"
  });
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<{
    totalEmployees: number;
    totalBaseSalary: number;
    totalDeductions: number;
    totalPayroll: number;
  }>({
    totalEmployees: 0,
    totalBaseSalary: 0,
    totalDeductions: 0,
    totalPayroll: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Hidden by default for employee personal view like banking apps, revealable via Eye icon
  const [showPay, setShowPay] = useState(!isEmployeeOnly);
  const [selectedPayslipRecord, setSelectedPayslipRecord] = useState<PayrollRecord | null>(null);

  useEffect(() => {
    fetchPayroll();
  }, [month, userId]);

  const fetchPayroll = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/payroll?month=${month}`;
      if (userId) {
        url += `&userId=${userId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPayroll(data.payroll);
        setSummary(data.summary);
      } else {
        setError(data.error || 'Failed to fetch payroll');
      }
    } catch {
      setError('Error connecting to payroll server');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCompanySheet = () => {
    window.location.href = `/api/export/salary?month=${month}`;
  };

  const handleDownloadSingleEmployeeSheet = (empUserId: string) => {
    window.location.href = `/api/export/salary?month=${month}&userId=${empUserId}`;
  };

  const filtered = payroll.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              Payroll & Deduction Calculator
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {isEmployeeOnly ? 'My Salary & Leave Fine Details' : 'Monthly Salary Sheet & Leave Fines'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Policy: 18 annual leaves (1 full day &amp; 1 half leave per month carry-forward). Late arrivals are logged for attendance records with zero salary penalty.
            </p>
          </div>

          {/* Month Selector & Download Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-2xl">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Eye toggle button for privacy */}
            <button
              type="button"
              onClick={() => setShowPay((prev) => !prev)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
              title={showPay ? 'Hide salary amounts' : 'View salary amounts'}
            >
              {showPay ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-emerald-400" />
              )}
              <span>{showPay ? 'Hide Figures' : 'View Figures'}</span>
            </button>

            {!isEmployeeOnly && (
              <button
                onClick={handleDownloadCompanySheet}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Company Sheet (.xlsx)
              </button>
            )}

            {isEmployeeOnly && payroll.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedPayslipRecord(payroll[0])}
                  className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  View &amp; Print Payslip
                </button>
                <button
                  onClick={() => handleDownloadSingleEmployeeSheet(payroll[0].userId)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download My Pay Sheet (.xlsx)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          <div className="p-4 bg-[#131E36] border border-slate-800 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isEmployeeOnly ? 'Base Salary' : 'Total Base Salaries'}
            </div>
            <div className="text-xl font-black text-white mt-1">
              {showPay ? `PKR ${summary.totalBaseSalary.toLocaleString()}` : <span className="font-mono tracking-widest text-slate-300">PKR ••••••</span>}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Gross monthly earnings</div>
          </div>

          <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl">
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              Excess Leave Deductions
            </div>
            <div className="text-xl font-black text-rose-400 mt-1">
              {showPay
                ? `- PKR ${(summary as any).totalLeaveDeductions !== undefined ? (summary as any).totalLeaveDeductions.toLocaleString() : summary.totalDeductions.toLocaleString()}`
                : <span className="font-mono tracking-widest text-rose-300">- PKR ••••••</span>}
            </div>
            <div className="text-[11px] text-rose-300/70 mt-0.5">Exceeding annual accrued leave quota</div>
          </div>

          <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-2xl">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              Tax Withholding
            </div>
            <div className="text-xl font-black text-amber-400 mt-1">
              {showPay
                ? `- PKR ${((summary as any).totalTaxDeductions ?? 0).toLocaleString()}`
                : <span className="font-mono tracking-widest text-amber-300">- PKR ••••••</span>}
            </div>
            <div className="text-[11px] text-amber-300/70 mt-0.5">FBR / Income tax deduction</div>
          </div>

          <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {isEmployeeOnly ? 'Net Payable Salary' : 'Total Net Payroll'}
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {showPay ? `PKR ${summary.totalPayroll.toLocaleString()}` : <span className="font-mono tracking-widest text-emerald-300">PKR ••••••</span>}
            </div>
            <div className="text-[11px] text-emerald-300/70 mt-0.5">Final take-home amount</div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 text-red-300 border border-red-800/80 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            {error}
          </div>
        )}
      </div>

      {/* Salary Details Table */}
      <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 shadow-xl">
        {!isEmployeeOnly && (
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{filtered.length}</span> records for {month}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Computing payroll for {month}...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No payroll records found for {month}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Employee</th>
                  <th className="pb-3 text-right">Base Salary</th>
                  <th className="pb-3 text-right">Per Day Rate</th>
                  <th className="pb-3 text-center">Present</th>
                  <th className="pb-3 text-center">Late Count</th>
                  <th className="pb-3 text-center">Offs (Used / Free)</th>
                  <th className="pb-3 text-center">Half Leaves (Used / Free)</th>
                  <th className="pb-3 text-right">Leave Cuts</th>
                  <th className="pb-3 text-right">Income Tax</th>
                  <th className="pb-3 text-right">Net Pay</th>
                  <th className="pb-3 text-center">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((record) => (
                  <tr key={record.userId} className="hover:bg-slate-900/60 transition-colors">
                    {/* Employee */}
                    <td className="py-3.5 pl-2 pr-4">
                      <div className="font-bold text-white leading-tight">{record.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-slate-300">{record.employeeId}</span>
                        <span>•</span>
                        <span>{record.department}</span>
                      </div>
                    </td>

                    {/* Base Salary */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-300">
                      {showPay ? `PKR ${record.baseSalary.toLocaleString()}` : <span className="font-mono text-xs text-slate-400">••••••</span>}
                    </td>

                    {/* Per Day Rate */}
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-amber-400 bg-amber-950/20 rounded-lg">
                      {showPay ? `PKR ${record.dailyRate.toLocaleString()}` : <span className="font-mono text-xs text-amber-400/80">••••••</span>}
                      <span className="text-[10px] text-slate-400 block font-sans">/day</span>
                    </td>

                    {/* Present Days */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[11px]">
                        {record.presentDays} days
                      </span>
                      {Boolean(record.wfhDays) && (
                        <span className="text-[10px] text-cyan-400 block font-medium mt-0.5">
                          🏡 {record.wfhDays} WFH
                        </span>
                      )}
                    </td>

                    {/* Late Count (Record only - no penalty) */}
                    <td className="py-3.5 px-3 text-center">
                      {record.lateDays > 0 ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 text-[11px]">
                            {record.lateDays} Late
                          </span>
                          <span className="text-[9px] text-slate-500 mt-0.5">Record Only</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs font-mono">0</span>
                      )}
                    </td>

                    {/* Offs */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="text-white font-semibold">
                        {record.totalOffs} <span className="text-slate-400 font-normal">/ {record.allowedOffs} free</span>
                      </div>
                      {record.excessOffs > 0 && (
                        <div className="text-[10px] text-rose-400 font-bold">
                          {record.excessOffs} excess: -PKR {record.offDeduction.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Half Leaves */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="text-white font-semibold">
                        {record.totalHalfLeaves} <span className="text-slate-400 font-normal">/ {record.allowedHalfLeaves} free</span>
                      </div>
                      {record.excessHalfLeaves > 0 && (
                        <div className="text-[10px] text-rose-400 font-bold">
                          {record.excessHalfLeaves} excess: -PKR {record.halfLeaveDeduction.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Leave Cuts */}
                    <td className="py-3.5 px-3 text-right font-bold text-rose-400">
                      {(record as any).leaveDeduction !== undefined && (record as any).leaveDeduction > 0
                        ? `-PKR ${(record as any).leaveDeduction.toLocaleString()}`
                        : record.totalDeduction > 0 && !((record as any).taxDeduction)
                        ? `-PKR ${record.totalDeduction.toLocaleString()}`
                        : 'PKR 0'}
                    </td>

                    {/* Income Tax */}
                    <td className="py-3.5 px-3 text-right">
                      {(record as any).taxDeduction > 0 ? (
                        <div>
                          <span className="font-bold text-amber-400">
                            -PKR {(record as any).taxDeduction.toLocaleString()}
                          </span>
                          {(record as any).taxSlab ? (
                            <span className="block text-[9px] font-bold text-amber-300/80">
                              Slab #{(record as any).taxSlab}
                            </span>
                          ) : (
                            <span className="block text-[9px] text-slate-500">Withheld</span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-400 font-medium">PKR 0</span>
                          <span className="block text-[9px] text-emerald-400/80 font-bold">Tax-Free</span>
                        </div>
                      )}
                    </td>

                    {/* Net Salary */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-black text-emerald-400 text-sm">
                        {showPay ? `PKR ${record.netSalary.toLocaleString()}` : <span className="font-mono text-xs">PKR ••••••</span>}
                      </span>
                    </td>

                    {/* Export Single Sheet */}
                    <td className="py-3.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslipRecord(record)}
                          title="View Official Payslip"
                          className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-orange-950/40 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadSingleEmployeeSheet(record.userId)}
                          title="Download Individual Employee Excel Sheet"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Slip</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL SALARY PAYSLIP MODAL (PRINT & EXPORT VIEW) */}
      {/* ========================================================================= */}
      {selectedPayslipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0D1527] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Top Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Verified Salary Statement
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Print Payslip or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSingleEmployeeSheet(selectedPayslipRecord.userId)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download Excel Sheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslipRecord(null)}
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div id="printable-payslip" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5 text-slate-200">
              {/* Company Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white p-2 flex items-center justify-center shrink-0 shadow-md">
                    <img src="/skyland-icon.png" alt="Skyland Emblem" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white tracking-tight leading-tight">
                      SKYLAND ENERGY (PVT) LTD
                    </h3>
                    <p className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">
                      OFFICIAL SALARY PAYSLIP
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono font-bold text-slate-400 block">
                    PERIOD: {month}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Generated: {new Date().toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Employee ID</span>
                  <span className="font-mono font-bold text-white mt-0.5 block">{selectedPayslipRecord.employeeId}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Full Name</span>
                  <span className="font-bold text-white mt-0.5 block truncate">{selectedPayslipRecord.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Department</span>
                  <span className="font-medium text-slate-300 mt-0.5 block truncate">{selectedPayslipRecord.department}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Designation</span>
                  <span className="font-medium text-slate-300 mt-0.5 block truncate">{selectedPayslipRecord.designation}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Joining Date</span>
                  <span className="font-medium text-slate-200 mt-0.5 block">{formatJoiningDate(selectedPayslipRecord.joinDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Work Mode</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {selectedPayslipRecord.workMode || 'OFFICE'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Approved Weekly Offs</span>
                  <span className="font-medium text-emerald-300 mt-0.5 block">
                    {formatOffDays(selectedPayslipRecord.weeklyOffDays)} (Zero Salary Deduction)
                  </span>
                </div>
              </div>

              {/* Attendance Breakdown Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Present Days</span>
                  <span className="text-sm font-black text-emerald-400 mt-0.5 block">{selectedPayslipRecord.presentDays} Days</span>
                  {Boolean(selectedPayslipRecord.wfhDays) && (
                    <span className="text-[10px] text-cyan-400 block font-medium">({selectedPayslipRecord.wfhDays} WFH)</span>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Late Arrivals</span>
                  <span className="text-sm font-bold text-amber-400 mt-0.5 block">{selectedPayslipRecord.lateDays}</span>
                  <span className="text-[10px] text-slate-500 block">Record Only</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Rostered Offs</span>
                  <span className="text-sm font-bold text-sky-400 mt-0.5 block">{selectedPayslipRecord.rosteredOffs ?? 0} Days</span>
                  <span className="text-[10px] text-emerald-400 block font-semibold">100% Paid</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Monthly Offs</span>
                  <span className="text-sm font-bold text-slate-200 mt-0.5 block">{selectedPayslipRecord.totalOffs} Offs • {selectedPayslipRecord.totalHalfLeaves} Half</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-sky-400 block">Annual Leave Balance</span>
                  <span className="text-sm font-black text-sky-300 mt-0.5 block">{selectedPayslipRecord.remainingLeaveBalance ?? 1.5} Days</span>
                  <span className="text-[9px] text-slate-400 block">({selectedPayslipRecord.cumulativeAccruedLeaves ?? 1.5} / 18 Accrued)</span>
                </div>
              </div>

              {/* Itemized Financial Ledger Table */}
              <div className="space-y-2 border-t border-b border-slate-800/80 py-3.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-300 pb-1.5 border-b border-slate-800/50">
                  <span>Description / Component</span>
                  <span>Amount (PKR)</span>
                </div>

                <div className="flex items-center justify-between text-slate-200 pt-1">
                  <span>Basic Monthly Salary (Contracted)</span>
                  <span className="font-mono font-bold text-white">PKR {selectedPayslipRecord.baseSalary.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Daily Wage Rate (Divisor: 30 days)</span>
                  <span className="font-mono">PKR {selectedPayslipRecord.dailyRate.toLocaleString()} / day</span>
                </div>

                {selectedPayslipRecord.excessOffs > 0 && (
                  <div className="flex items-center justify-between text-rose-400">
                    <span>Excess Unpaid Offs ({selectedPayslipRecord.excessOffs} day(s) deducted)</span>
                    <span className="font-mono font-bold">-PKR {selectedPayslipRecord.offDeduction.toLocaleString()}</span>
                  </div>
                )}

                {selectedPayslipRecord.excessHalfLeaves > 0 && (
                  <div className="flex items-center justify-between text-rose-400">
                    <span>Excess Half Leaves ({selectedPayslipRecord.excessHalfLeaves} half-day(s) deducted)</span>
                    <span className="font-mono font-bold">-PKR {selectedPayslipRecord.halfLeaveDeduction.toLocaleString()}</span>
                  </div>
                )}

                {selectedPayslipRecord.taxDeduction > 0 && (
                  <div className="flex items-center justify-between text-amber-400">
                    <span>FBR Income Tax Withheld {selectedPayslipRecord.taxSlab ? `(Slab #${selectedPayslipRecord.taxSlab})` : ''}</span>
                    <span className="font-mono font-bold">-PKR {selectedPayslipRecord.taxDeduction.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/50 font-semibold">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-400 font-bold">-PKR {selectedPayslipRecord.totalDeduction.toLocaleString()}</span>
                </div>
              </div>

              {/* Net Take Home Highlight */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Net Take-Home Salary Payable
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Disbursed directly via bank auto-credit
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                    PKR {selectedPayslipRecord.netSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Legal Notice */}
              <p className="text-[10px] text-slate-500 text-center leading-relaxed pt-1">
                This is an official computer-generated payslip issued by Skyland Energy Portal.
                All calculations strictly adhere to company HR policy: 18 annual leaves (1 full day & 1 half leave per month carry-forward), 10% salary pre-tax relief with FBR tax slabs, and zero financial penalty for late arrivals.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
