'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  User as UserIcon,
  Save,
  Trash2,
  X,
  Edit3,
} from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  date: string; // "YYYY-MM-DD"
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'HALF_LEAVE' | 'ABSENT' | 'OFF' | 'ON_LEAVE';
  clockIn: string | null;
  clockOut: string | null;
  totalWorkMinutes: number;
  notes?: string;
}

interface AttendanceCalendarProps {
  currentUserId: string;
  userRole: string;
}

export default function AttendanceCalendar({ currentUserId, userRole }: AttendanceCalendarProps) {
  const isManagement = ['developer', 'admin', 'ceo', 'manager'].includes(userRole);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);
  const [employeesList, setEmployeesList] = useState<{ _id: string; name: string; employeeId: string; baseSalary?: number }[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Day detail / edit modal state
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ date: string; record: AttendanceRecord | null } | null>(null);
  const [editStatus, setEditStatus] = useState<string>('PRESENT');
  const [editClockIn, setEditClockIn] = useState<string>('09:00');
  const [editClockOut, setEditClockOut] = useState<string>('18:00');
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingAdjustment, setSavingAdjustment] = useState<boolean>(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Fetch employees list if management
  useEffect(() => {
    if (isManagement) {
      fetch('/api/employees')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.employees && data.employees.length > 0) {
            setEmployeesList(data.employees);
            // Default selection to first staff employee so management doesn't view blank admin records
            if (['developer', 'admin', 'ceo', 'manager'].includes(userRole)) {
              setSelectedUserId(data.employees[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isManagement, userRole]);

  // Fetch attendance records for selected user and month
  useEffect(() => {
    fetchRecords();
  }, [selectedUserId, monthString]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/history?userId=${selectedUserId}&month=${monthString}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
      }
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenDay = (dateKey: string, record: AttendanceRecord | null) => {
    setSelectedDayDetail({ date: dateKey, record });
    setAdjustError(null);
    if (record) {
      setEditStatus(record.status || 'PRESENT');
      setEditClockIn(
        record.clockIn
          ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : '09:00'
      );
      setEditClockOut(
        record.clockOut
          ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : ''
      );
      setEditNotes(record.notes || '');
    } else {
      setEditStatus('PRESENT');
      setEditClockIn('09:00');
      setEditClockOut('18:00');
      setEditNotes('');
    }
  };

  const handleSaveAdjustment = async () => {
    if (!selectedDayDetail) return;
    setSavingAdjustment(true);
    setAdjustError(null);
    try {
      const res = await fetch('/api/attendance/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          date: selectedDayDetail.date,
          status: editStatus,
          clockIn: editClockIn || undefined,
          clockOut: editClockOut || undefined,
          notes: editNotes.trim(),
          regularizedReason: `Adjusted via Calendar by Management`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchRecords();
        setSelectedDayDetail(null);
      } else {
        setAdjustError(data.error || 'Failed to save attendance');
      }
    } catch {
      setAdjustError('Error connecting to server');
    } finally {
      setSavingAdjustment(false);
    }
  };

  const handleDeleteAdjustment = async () => {
    if (!selectedDayDetail) return;
    if (!confirm(`Are you sure you want to permanently delete the attendance record for ${selectedDayDetail.date}?`)) return;
    setSavingAdjustment(true);
    setAdjustError(null);
    try {
      const res = await fetch(`/api/attendance/adjust?userId=${selectedUserId}&date=${selectedDayDetail.date}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchRecords();
        setSelectedDayDetail(null);
      } else {
        setAdjustError(data.error || 'Failed to delete attendance record');
      }
    } catch {
      setAdjustError('Error connecting to server');
    } finally {
      setSavingAdjustment(false);
    }
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek < 0) startingDayOfWeek = 6;

  const recordsMap = new Map<string, AttendanceRecord>();
  for (const r of records) {
    recordsMap.set(r.date, r);
  }

  // Monthly stats
  let presentDays = 0;
  let lateDays = 0;
  let totalOffs = 0;
  let totalHalfLeaves = 0;

  for (const r of records) {
    if (r.status === 'PRESENT') {
      presentDays++;
    } else if (r.status === 'LATE') {
      lateDays++;
      presentDays++;
    } else if (r.status === 'HALF_LEAVE' || r.status === 'HALF_DAY') {
      totalHalfLeaves++;
    } else if (r.status === 'OFF' || r.status === 'ABSENT' || r.status === 'ON_LEAVE') {
      totalOffs++;
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950 text-orange-400 border border-orange-800 mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              Monthly Attendance Calendar
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isManagement
                ? 'Click on any calendar day to inspect, change status, or edit punch times for past dates.'
                : 'Review your monthly attendance, clock-in times, and schedule.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* If Admin/Manager, show user switcher */}
            {isManagement && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl">
                <UserIcon className="w-4 h-4 text-orange-400 shrink-0" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
                >
                  {employeesList.map((emp) => (
                    <option key={emp._id} value={emp._id} className="bg-slate-900 text-white">
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Current Month
              </button>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Summary KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Days Present</span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{presentDays}</div>
            <span className="text-[10px] text-emerald-500/80">Monthly attendances</span>
          </div>

          <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-2xl">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Late Arrivals</span>
            <div className="text-xl font-black text-amber-300 mt-0.5">{lateDays}</div>
            <span className="text-[10px] text-amber-500/80">Punctuality log</span>
          </div>

          <div className="p-3 bg-orange-950/40 border border-orange-800/80 rounded-2xl">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Half Leaves</span>
            <div className="text-xl font-black text-orange-300 mt-0.5">{totalHalfLeaves}</div>
            <span className="text-[10px] text-orange-500/80">Half day records</span>
          </div>

          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-2xl">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Offs &amp; Absents</span>
            <div className="text-xl font-black text-rose-300 mt-0.5">{totalOffs}</div>
            <span className="text-[10px] text-rose-500/80">Total off days</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-6 shadow-xs">
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs">Loading calendar records...</div>
        ) : (
          <div className="overflow-x-auto">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 min-w-[650px] mb-2 text-center text-[11px] font-extrabold uppercase text-slate-400">
              <div className="py-1">Mon</div>
              <div className="py-1">Tue</div>
              <div className="py-1">Wed</div>
              <div className="py-1">Thu</div>
              <div className="py-1">Fri</div>
              <div className="py-1">Sat</div>
              <div className="py-1 text-rose-400">Sun</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 min-w-[650px]">
              {/* Blank leading slots */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-24 rounded-2xl bg-slate-900/20 border border-slate-800/30" />
              ))}

              {/* Day slots */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const dayNumber = index + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                const cellDate = new Date(year, month, dayNumber);
                const isSunday = cellDate.getDay() === 0;
                const record = recordsMap.get(dateKey);

                let cellBg = 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700';
                let badge = null;

                if (isSunday) {
                  cellBg = 'bg-slate-950/40 border-slate-800/40';
                }

                if (record) {
                  if (record.status === 'PRESENT') {
                    cellBg = 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-600';
                    badge = (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          Present
                        </span>
                        {record.clockIn && (
                          <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                        )}
                      </div>
                    );
                  } else if (record.status === 'LATE') {
                    cellBg = 'bg-amber-950/20 border-amber-800/40 hover:border-amber-600';
                    badge = (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800">
                          Late
                        </span>
                        {record.clockIn && (
                          <div className="text-[10px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                        )}
                      </div>
                    );
                  } else if (record.status === 'HALF_LEAVE' || record.status === 'HALF_DAY') {
                    cellBg = 'bg-orange-950/20 border-orange-800/40 hover:border-orange-600';
                    badge = (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-orange-950/80 text-orange-300 border border-orange-800">
                          Half Leave
                        </span>
                      </div>
                    );
                  } else if (record.status === 'OFF' || record.status === 'ABSENT' || record.status === 'ON_LEAVE') {
                    cellBg = 'bg-rose-950/20 border-rose-800/40 hover:border-rose-600';
                    badge = (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800">
                          Off Day
                        </span>
                      </div>
                    );
                  }
                } else if (isSunday) {
                  badge = (
                    <div className="mt-1">
                      <span className="inline-block px-1.5 py-0.5 rounded-md font-semibold text-[10px] bg-slate-900 text-slate-500 border border-slate-800">
                        Weekend
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={dateKey}
                    onClick={() => handleOpenDay(dateKey, record || null)}
                    className={`min-h-24 p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${cellBg}`}
                    title={isManagement ? 'Click to inspect or edit attendance' : 'Click to view details'}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSunday ? 'text-rose-400' : 'text-slate-200'}`}>
                        {dayNumber}
                      </span>
                      {record?.notes && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" title="Has notes" />
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      {badge}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="font-bold text-slate-300">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>Half Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Off / Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span>Weekend / Off Day</span>
          </div>
        </div>
      </div>

      {/* Day Details & Admin Edit Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0D1527] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  {isManagement ? 'Edit Attendance Record' : 'Attendance Details'}
                </h3>
                <p className="text-xs text-orange-400 font-mono mt-0.5">
                  Date: {selectedDayDetail.date}
                </p>
              </div>

              <button
                onClick={() => setSelectedDayDetail(null)}
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adjustError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            {isManagement ? (
              /* ========================================================================= */
              /* ADMIN / MANAGEMENT EDIT FORM: CAN CHANGE TIME ANYTIME & PAST DATES */
              /* ========================================================================= */
              <div className="space-y-4">
                {/* Status Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                    Attendance Status
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditStatus('PRESENT')}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        editStatus === 'PRESENT'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('LATE')}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        editStatus === 'LATE'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Late
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('HALF_LEAVE')}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        editStatus === 'HALF_LEAVE' || editStatus === 'HALF_DAY'
                          ? 'bg-[#FF6B00] text-white border-orange-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Half Leave
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('OFF')}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        editStatus === 'OFF' || editStatus === 'ABSENT'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Off
                    </button>
                  </div>
                </div>

                {/* Clock In & Clock Out Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Clock In Time
                    </label>
                    <input
                      type="time"
                      value={editClockIn}
                      onChange={(e) => setEditClockIn(e.target.value)}
                      disabled={editStatus === 'OFF'}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-orange-500 disabled:opacity-40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Clock Out Time
                    </label>
                    <input
                      type="time"
                      value={editClockOut}
                      onChange={(e) => setEditClockOut(e.target.value)}
                      disabled={editStatus === 'OFF'}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-orange-500 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Register Notes / Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adjusted by admin, shift delay, client site visit..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  {selectedDayDetail.record ? (
                    <button
                      type="button"
                      onClick={handleDeleteAdjustment}
                      disabled={savingAdjustment}
                      className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold rounded-xl border border-rose-800/80 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDayDetail(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAdjustment}
                      disabled={savingAdjustment}
                      className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {savingAdjustment ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* REGULAR EMPLOYEE READ-ONLY DETAIL VIEW */
              /* ========================================================================= */
              selectedDayDetail.record ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-slate-400">Status</span>
                    <span className="font-bold text-white">{selectedDayDetail.record.status}</span>
                  </div>
                  {selectedDayDetail.record.clockIn && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="text-slate-400">Time In</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {new Date(selectedDayDetail.record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  {selectedDayDetail.record.clockOut && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="text-slate-400">Time Out</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {new Date(selectedDayDetail.record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  {selectedDayDetail.record.notes && (
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="text-slate-400 block mb-1">Notes / Reason:</span>
                      <span className="text-slate-200">{selectedDayDetail.record.notes}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedDayDetail(null)}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  <p>No attendance record marked for this date.</p>
                  <button
                    onClick={() => setSelectedDayDetail(null)}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
