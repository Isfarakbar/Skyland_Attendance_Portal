'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Edit3, CheckCircle2, Clock, XCircle, Palmtree, UserX } from 'lucide-react';
import { format } from 'date-fns';

interface RosterItem {
  user: {
    _id: string;
    name: string;
    email: string;
    employeeId: string;
    department: string;
    designation: string;
  };
  date: string;
  status: string; // 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE'
  isClockedIn: boolean;
  clockIn: string | null;
  clockOut: string | null;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  attendance?: any;
}

export default function AdminRoster() {
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Adjustment modal state
  const [editingItem, setEditingItem] = useState<RosterItem | null>(null);
  const [adjustClockIn, setAdjustClockIn] = useState('');
  const [adjustClockOut, setAdjustClockOut] = useState('');
  const [adjustStatus, setAdjustStatus] = useState('PRESENT');
  const [adjustReason, setAdjustReason] = useState('');
  const [savingAdjust, setSavingAdjust] = useState(false);

  useEffect(() => {
    fetchRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedDept]);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/all?date=${selectedDate}&department=${selectedDept}`);
      const data = await res.json();
      if (data.success) {
        setRoster(data.roster);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = (item: RosterItem) => {
    setEditingItem(item);
    setAdjustStatus(item.status === 'ABSENT' ? 'PRESENT' : item.status);
    setAdjustReason('Regularized by Management');
    if (item.clockIn) {
      setAdjustClockIn(format(new Date(item.clockIn), "yyyy-MM-dd'T'HH:mm"));
    } else {
      setAdjustClockIn(`${selectedDate}T09:00`);
    }
    if (item.clockOut) {
      setAdjustClockOut(format(new Date(item.clockOut), "yyyy-MM-dd'T'HH:mm"));
    } else {
      setAdjustClockOut(`${selectedDate}T18:00`);
    }
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSavingAdjust(true);
    try {
      const res = await fetch('/api/attendance/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingItem.user._id,
          date: selectedDate,
          clockIn: adjustClockIn ? new Date(adjustClockIn).toISOString() : null,
          clockOut: adjustClockOut ? new Date(adjustClockOut).toISOString() : null,
          status: adjustStatus,
          regularizedReason: adjustReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        fetchRoster();
      } else {
        alert(data.error || 'Failed to adjust attendance');
      }
    } catch {
      alert('Error updating attendance');
    } finally {
      setSavingAdjust(false);
    }
  };

  const filteredRoster = roster.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(search.toLowerCase()) ||
      item.user.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      item.user.department.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string, isClockedIn: boolean) => {
    if (isClockedIn) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Active Working
        </span>
      );
    }
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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Absent</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Daily Attendance Roster</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time team presence, punctuality, and manual time adjustments</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-hidden"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
            <option value="Human Resources">HR</option>
            <option value="Executive">Executive</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto mt-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading daily roster...</div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No employees found.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50/70 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Work Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.map((item) => {
                const clockInFormatted = item.clockIn ? format(new Date(item.clockIn), 'hh:mm:ss a') : '--';
                const clockOutFormatted = item.clockOut ? format(new Date(item.clockOut), 'hh:mm:ss a') : '--';
                const hours = (item.totalWorkMinutes / 60).toFixed(1);

                return (
                  <tr key={item.user._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {item.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{item.user.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{item.user.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">{item.user.department}</p>
                      <p className="text-[11px] text-slate-400">{item.user.designation}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status, item.isClockedIn)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-slate-700">
                      {clockInFormatted}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-slate-700">
                      {clockOutFormatted}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-indigo-700">
                      {hours} hrs
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenAdjust(item)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Adjust or Regularize Punch"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjust Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Adjust Attendance</h3>
            <p className="text-xs text-slate-500 mb-4">
              Manual correction for <span className="font-semibold text-slate-900">{editingItem.user.name}</span> on {selectedDate}
            </p>

            <form onSubmit={handleSaveAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={adjustStatus}
                  onChange={(e) => setAdjustStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PRESENT">Present (On Time)</option>
                  <option value="LATE">Late Arrival</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clock In Time</label>
                <input
                  type="datetime-local"
                  value={adjustClockIn}
                  onChange={(e) => setAdjustClockIn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clock Out Time</label>
                <input
                  type="datetime-local"
                  value={adjustClockOut}
                  onChange={(e) => setAdjustClockOut(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Adjustment Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Employee forgot to punch out"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdjust}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs"
                >
                  {savingAdjust ? 'Saving...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
