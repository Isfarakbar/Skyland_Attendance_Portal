'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, DollarSign, Calendar, Search, AlertCircle, ArrowDownRight, User } from 'lucide-react';
import { PayrollRecord } from '@/app/api/payroll/route';

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
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              Payroll & Deduction Calculator
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isEmployeeOnly ? 'My Salary & Leave Fine Details' : 'Monthly Salary Sheet & Leave Fines'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Policy: 1 free Off & 1 free Half Leave per month. Fines are calculated from your per-day income (Monthly Pay ÷ 30).
            </p>
          </div>

          {/* Month Selector & Download Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              />
            </div>

            {!isEmployeeOnly && (
              <button
                onClick={handleDownloadCompanySheet}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xs shadow-emerald-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Company Sheet (.xlsx)
              </button>
            )}

            {isEmployeeOnly && payroll.length > 0 && (
              <button
                onClick={() => handleDownloadSingleEmployeeSheet(payroll[0].userId)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xs shadow-emerald-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download My Pay Sheet (.xlsx)
              </button>
            )}
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isEmployeeOnly ? 'Base Salary' : 'Total Base Salaries'}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              PKR {summary.totalBaseSalary.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Before leave deductions</div>
          </div>

          <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              Excess Leave Deductions
            </div>
            <div className="text-2xl font-black text-rose-700 mt-1">
              - PKR {summary.totalDeductions.toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-500 mt-0.5">Exceeding 1 off / 1 half leave limit</div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              {isEmployeeOnly ? 'Net Payable Salary' : 'Total Net Payroll'}
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              PKR {summary.totalPayroll.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Final amount after calculation</div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Salary Details Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        {!isEmployeeOnly && (
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-slate-700">{filtered.length}</span> records for {month}
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
                <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Employee</th>
                  <th className="pb-3 text-right">Monthly Pay</th>
                  <th className="pb-3 text-right">Per Day Rate (Pay÷30)</th>
                  <th className="pb-3 text-center">Present</th>
                  <th className="pb-3 text-center">Offs (Used / Free)</th>
                  <th className="pb-3 text-center">Half Leaves (Used / Free)</th>
                  <th className="pb-3 text-right">Leave Fines</th>
                  <th className="pb-3 text-right">Net Salary</th>
                  <th className="pb-3 text-center">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((record) => (
                  <tr key={record.userId} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee */}
                    <td className="py-3.5 pl-2 pr-4">
                      <div className="font-bold text-slate-900 leading-tight">{record.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{record.employeeId}</span>
                        <span>•</span>
                        <span>{record.department}</span>
                      </div>
                    </td>

                    {/* Base Salary */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                      PKR {record.baseSalary.toLocaleString()}
                    </td>

                    {/* Per Day Rate */}
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-indigo-700 bg-indigo-50/30 rounded-lg">
                      PKR {record.dailyRate.toLocaleString()}
                      <span className="text-[10px] text-slate-400 block font-sans">/day</span>
                    </td>

                    {/* Present Days */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-50 text-[11px]">
                        {record.presentDays} days
                      </span>
                    </td>

                    {/* Offs */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="text-slate-800 font-semibold">
                        {record.totalOffs} <span className="text-slate-400 font-normal">/ 1 free</span>
                      </div>
                      {record.excessOffs > 0 && (
                        <div className="text-[10px] text-rose-600 font-bold">
                          {record.excessOffs} excess fine: -PKR {record.offDeduction.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Half Leaves */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="text-slate-800 font-semibold">
                        {record.totalHalfLeaves} <span className="text-slate-400 font-normal">/ 1 free</span>
                      </div>
                      {record.excessHalfLeaves > 0 && (
                        <div className="text-[10px] text-amber-600 font-bold">
                          {record.excessHalfLeaves} excess fine: -PKR {record.halfLeaveDeduction.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Total Leave Fines */}
                    <td className="py-3.5 px-3 text-right font-bold text-rose-600">
                      {record.totalDeduction > 0 ? `-PKR ${record.totalDeduction.toLocaleString()}` : 'PKR 0'}
                    </td>

                    {/* Net Salary */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-black text-slate-900 text-sm">
                        PKR {record.netSalary.toLocaleString()}
                      </span>
                    </td>

                    {/* Export Single Sheet */}
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => handleDownloadSingleEmployeeSheet(record.userId)}
                        title="Download Individual Employee Sheet"
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
