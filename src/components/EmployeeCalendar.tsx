'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, Coffee, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface RecordItem {
  _id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  isRegularized: boolean;
  notes?: string;
}

export default function EmployeeCalendar({ userId }: { userId?: string }) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, userId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = `/api/attendance/history?month=${selectedMonth}&year=${selectedYear}`;
      if (userId) url += `&userId=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Present</span>;
      case 'LATE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Late</span>;
      case 'HALF_DAY':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">Half Day</span>;
      case 'ON_LEAVE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">On Leave</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Absent</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Attendance History & Logs
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Detailed day-by-day record of punches and work hours</p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m.toString()}>
                {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading attendance history...</div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No attendance records found for this period.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50/70 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Break Time</th>
                <th className="py-3 px-4">Total Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => {
                const clockInFormatted = r.clockIn ? format(new Date(r.clockIn), 'hh:mm:ss a') : '--';
                const clockOutFormatted = r.clockOut ? format(new Date(r.clockOut), 'hh:mm:ss a') : '--';
                const hours = (r.totalWorkMinutes / 60).toFixed(1);

                return (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {format(new Date(r.date + 'T00:00:00'), 'EEE, MMM dd, yyyy')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-mono text-xs">
                      {clockInFormatted}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-mono text-xs">
                      {clockOutFormatted}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-xs">
                      {r.totalBreakMinutes > 0 ? `${r.totalBreakMinutes} mins` : 'None'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-indigo-700">
                      {hours} hrs
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(r.status)}
                        {r.isRegularized && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.2 rounded font-semibold">
                            Adjusted
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
