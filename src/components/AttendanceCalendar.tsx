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
  MapPin,
  Info,
  Gift,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Check,
} from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  date: string; // "YYYY-MM-DD"
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'HALF_LEAVE' | 'ABSENT' | 'OFF' | 'ON_LEAVE' | 'WFH';
  workMode?: 'OFFICE' | 'FIELD' | 'WFH';
  isWorkFromHome?: boolean;
  clockIn: string | null;
  clockOut: string | null;
  location?: { latitude?: number; longitude?: number; siteName?: string } | null;
  checkOutLocation?: { latitude?: number; longitude?: number; siteName?: string } | null;
  totalWorkMinutes: number;
  notes?: string;
  employeeNote?: string;
  hasConcession?: boolean;
  concessionReason?: string;
  concessionGrantedBy?: string;
  concessionGrantedAt?: string;
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

  // Employee note state
  const [employeeNoteInput, setEmployeeNoteInput] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);
  const [noteMsg, setNoteMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Concession state (for management)
  const [concessionReasonInput, setConcessionReasonInput] = useState<string>('');
  const [savingConcession, setSavingConcession] = useState<boolean>(false);
  const [concessionError, setConcessionError] = useState<string | null>(null);

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
    setNoteMsg(null);
    setConcessionError(null);
    setEmployeeNoteInput(record?.employeeNote || '');
    setConcessionReasonInput(record?.concessionReason || '');

    if (record) {
      const isWfh = record.status === 'WFH' || record.workMode === 'WFH' || !!record.isWorkFromHome;
      setEditStatus(isWfh ? 'WFH' : (record.status || 'PRESENT'));
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
      setEditStatus('OFF');
      setEditClockIn('09:00');
      setEditClockOut('18:00');
      setEditNotes('');
    }
  };

  const handleSaveEmployeeNote = async () => {
    if (!selectedDayDetail) return;
    setSavingNote(true);
    setNoteMsg(null);
    try {
      const res = await fetch('/api/attendance/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          date: selectedDayDetail.date,
          note: employeeNoteInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchRecords();
        if (data.attendance) {
          setSelectedDayDetail((prev) => (prev ? { ...prev, record: data.attendance } : null));
        }
        setNoteMsg({ text: 'Note saved successfully!', type: 'success' });
        setTimeout(() => setNoteMsg(null), 2500);
      } else {
        setNoteMsg({ text: data.error || 'Failed to save note', type: 'error' });
      }
    } catch {
      setNoteMsg({ text: 'Error connecting to server', type: 'error' });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteEmployeeNote = async () => {
    if (!selectedDayDetail) return;
    setSavingNote(true);
    setNoteMsg(null);
    try {
      const res = await fetch(`/api/attendance/note?userId=${selectedUserId}&date=${selectedDayDetail.date}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchRecords();
        setEmployeeNoteInput('');
        if (data.attendance) {
          setSelectedDayDetail((prev) => (prev ? { ...prev, record: data.attendance } : null));
        }
        setNoteMsg({ text: 'Note deleted', type: 'success' });
        setTimeout(() => setNoteMsg(null), 2500);
      } else {
        setNoteMsg({ text: data.error || 'Failed to delete note', type: 'error' });
      }
    } catch {
      setNoteMsg({ text: 'Error connecting to server', type: 'error' });
    } finally {
      setSavingNote(false);
    }
  };

  const handleToggleConcession = async (grant: boolean) => {
    if (!selectedDayDetail) return;
    setSavingConcession(true);
    setConcessionError(null);
    try {
      const res = await fetch('/api/attendance/concession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          date: selectedDayDetail.date,
          hasConcession: grant,
          reason: concessionReasonInput || (grant ? 'Approved by Executive Management' : ''),
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchRecords();
        if (data.attendance) {
          setSelectedDayDetail((prev) => (prev ? { ...prev, record: data.attendance } : null));
        }
      } else {
        setConcessionError(data.error || 'Failed to update concession');
      }
    } catch {
      setConcessionError('Error connecting to server');
    } finally {
      setSavingConcession(false);
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
          employeeNote: employeeNoteInput,
          regularizedReason: `Adjusted via Calendar by Management`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchRecords();
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
        await fetchRecords();
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
  let wfhDays = 0;
  let lateDays = 0;
  let totalOffs = 0;
  let totalHalfLeaves = 0;
  let concessionCount = 0;

  for (const r of records) {
    if (r.hasConcession) {
      concessionCount++;
    }

    const isWfh = r.status === 'WFH' || (r.status === 'PRESENT' && (r.workMode === 'WFH' || !!r.isWorkFromHome));
    if (isWfh) {
      wfhDays++;
      presentDays++;
    } else if (r.status === 'PRESENT') {
      presentDays++;
    } else if (r.status === 'LATE') {
      lateDays++;
      presentDays++;
    } else if (r.status === 'HALF_LEAVE' || r.status === 'HALF_DAY') {
      if (!r.hasConcession) {
        totalHalfLeaves++;
      }
    } else if (r.status === 'OFF' || r.status === 'ABSENT' || r.status === 'ON_LEAVE') {
      if (!r.hasConcession) {
        totalOffs++;
      }
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950 text-orange-400 border border-orange-800 mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              Monthly Attendance &amp; Concessions Calendar
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isManagement
                ? 'Review employee reasons, past records, and grant executive concessions to waive salary cuts.'
                : 'Click any calendar day to add a short reason note for executive review & concessions.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* If Admin/Manager, show user switcher */}
            {isManagement && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-2xl max-w-full">
                <UserIcon className="w-4 h-4 text-orange-400 shrink-0" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer truncate"
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

        {((year === 2026 && month < 9) || year < 2026) && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-300 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Online Portal Launch Notice:</strong> The Skyland Online Attendance Portal went live on October 1, 2026. Prior months were recorded and settled offline.
            </span>
          </div>
        )}

        {/* Monthly Summary KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-5">
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Days Present</span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{presentDays}</div>
            <span className="text-[10px] text-emerald-500/80">Total worked</span>
          </div>

          <div className="p-3 bg-indigo-950/40 border border-indigo-800/80 rounded-2xl">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">🏡 Remote WFH</span>
            <div className="text-xl font-black text-indigo-300 mt-0.5">{wfhDays}</div>
            <span className="text-[10px] text-indigo-400/80">Home attendances</span>
          </div>

          <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-2xl">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Late Arrivals</span>
            <div className="text-xl font-black text-amber-300 mt-0.5">{lateDays}</div>
            <span className="text-[10px] text-amber-500/80">No penalty</span>
          </div>

          <div className="p-3 bg-orange-950/40 border border-orange-800/80 rounded-2xl">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Half Leaves</span>
            <div className="text-xl font-black text-orange-300 mt-0.5">{totalHalfLeaves}</div>
            <span className="text-[10px] text-orange-500/80">Unwaived count</span>
          </div>

          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-2xl">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Offs &amp; Absents</span>
            <div className="text-xl font-black text-rose-300 mt-0.5">{totalOffs}</div>
            <span className="text-[10px] text-rose-500/80">Unwaived count</span>
          </div>

          <div className="p-3 bg-purple-950/50 border border-purple-600/80 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
              <span>🎁</span> Concessions
            </span>
            <div className="text-xl font-black text-purple-200 mt-0.5">{concessionCount}</div>
            <span className="text-[10px] text-purple-400/90 font-semibold">Waived by CEO</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
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

                if (record?.hasConcession) {
                  // Distinct Luxury Violet / Purple Styling for Executive Concession
                  cellBg = 'bg-gradient-to-b from-purple-950/60 via-slate-900/90 to-indigo-950/50 border-purple-500/80 hover:border-purple-300 shadow-md shadow-purple-950/50 ring-1 ring-purple-500/40';
                  badge = (
                    <div className="mt-1 flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-black text-[10px] bg-gradient-to-r from-purple-900 to-indigo-900 text-purple-200 border border-purple-400 shadow-xs">
                        <span>🎁</span>
                        <span>Concession</span>
                      </span>
                      <span className="text-[9px] text-purple-300/80 font-semibold truncate">
                        Waived ({record.status === 'HALF_LEAVE' || record.status === 'HALF_DAY' ? 'Half Leave' : record.status === 'LATE' ? 'Late' : 'Off Day'})
                      </span>
                    </div>
                  );
                } else if (record) {
                  const isWfh = record.status === 'WFH' || (record.status === 'PRESENT' && (record.workMode === 'WFH' || !!record.isWorkFromHome));

                  if (isWfh) {
                    cellBg = 'bg-indigo-950/25 border-indigo-700/50 hover:border-indigo-500';
                    badge = (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-indigo-950/90 text-indigo-300 border border-indigo-700/80">
                          🏡 WFH
                        </span>
                        {record.clockIn && (
                          <div className="text-[10px] font-mono text-indigo-400 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                        )}
                      </div>
                    );
                  } else if (record.status === 'PRESENT') {
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
                    title={isManagement ? 'Click to inspect, edit attendance, or grant concession' : 'Click to add/edit reason note or view details'}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSunday ? 'text-rose-400' : record?.hasConcession ? 'text-purple-300 font-black' : 'text-slate-200'}`}>
                        {dayNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        {record?.hasConcession && (
                          <span className="text-[11px]" title="Executive Concession Granted">🎁</span>
                        )}
                        {record?.employeeNote && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs" title={`Employee Note: ${record.employeeNote}`} />
                        )}
                        {record?.notes && !record?.employeeNote && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" title="Has notes" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      {badge}

                      {/* Prominent Employee Reason Note Capsule */}
                      {record?.employeeNote && (
                        <div className="mt-1.5 max-w-full">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-amber-950/90 text-amber-200 border border-amber-600/50 truncate max-w-full shadow-xs"
                            title={`Reason: "${record.employeeNote}"`}
                          >
                            <span className="shrink-0 text-[10px]">💬</span>
                            <span className="truncate">{record.employeeNote}</span>
                          </span>
                        </div>
                      )}
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
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Work From Home (WFH)</span>
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
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-400/40" />
            <span className="text-purple-300 font-bold">🎁 CEO Concession (Waived / 0 Cut)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-300 font-medium">💬 Employee Short Note (Max 25c)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span>Weekend</span>
          </div>
        </div>
      </div>

      {/* Day Details & Admin / Employee Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0D1527] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-150 text-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                  <span>{isManagement ? 'Management Review & Edit' : 'Day Details & Short Reason'}</span>
                  {selectedDayDetail.record?.hasConcession && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-900 text-purple-200 border border-purple-400">
                      🎁 Concession
                    </span>
                  )}
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

            {/* ========================================================================= */}
            {/* 1. EXECUTIVE CONCESSION BANNER (IF GRANTED) */}
            {/* ========================================================================= */}
            {selectedDayDetail.record?.hasConcession && (
              <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/80 text-xs shadow-md shadow-purple-950/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-purple-200 text-sm">
                    <span>🎁</span>
                    <span>Executive Concession Granted!</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-900 text-purple-200 border border-purple-400">
                    Waived (0 Salary Cut)
                  </span>
                </div>
                <p className="text-[11px] text-purple-300 mt-1 leading-relaxed">
                  The CEO / Executive Management has waived this day. Zero salary deduction will be applied against leaves.
                </p>
                {selectedDayDetail.record.concessionReason && (
                  <p className="text-[11px] text-purple-200 font-medium mt-1.5 p-2 bg-purple-900/40 rounded-xl border border-purple-700/50">
                    <span className="text-purple-400 font-bold">Remark:</span> &ldquo;{selectedDayDetail.record.concessionReason}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. EMPLOYEE VIEW: READ ATTENDANCE + EDIT SHORT NOTE (MAX 25 CHARACTERS) */}
            {/* ========================================================================= */}
            {!isManagement ? (
              <div className="space-y-4">
                {/* Attendance Summary */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                    <span className="font-black text-white mt-0.5 block">
                      {selectedDayDetail.record
                        ? selectedDayDetail.record.status === 'WFH' || (selectedDayDetail.record.status === 'PRESENT' && (selectedDayDetail.record.workMode === 'WFH' || selectedDayDetail.record.isWorkFromHome))
                          ? '🏡 Work From Home'
                          : selectedDayDetail.record.status
                        : 'Unpunched (Off Day)'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Punches</span>
                    <span className="font-mono text-emerald-400 mt-0.5 block">
                      {selectedDayDetail.record?.clockIn
                        ? new Date(selectedDayDetail.record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'No In'}
                      {' - '}
                      {selectedDayDetail.record?.clockOut
                        ? new Date(selectedDayDetail.record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'No Out'}
                    </span>
                  </div>
                </div>

                {/* GPS Location if recorded */}
                {(selectedDayDetail.record?.location?.latitude || selectedDayDetail.record?.checkOutLocation?.latitude) && (
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      Recorded GPS Location:
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedDayDetail.record.location?.latitude && (
                        <a
                          href={`https://www.google.com/maps?q=${selectedDayDetail.record.location.latitude},${selectedDayDetail.record.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:underline font-bold"
                        >
                          Check-In Map
                        </a>
                      )}
                      {selectedDayDetail.record.checkOutLocation?.latitude && (
                        <a
                          href={`https://www.google.com/maps?q=${selectedDayDetail.record.checkOutLocation.latitude},${selectedDayDetail.record.checkOutLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:underline font-bold"
                        >
                          Check-Out Map
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Short Reason Note Input for Employee */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>💬</span> My Reason / Short Note
                    </label>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      {employeeNoteInput.length}/25 max
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Write a short reason (e.g. &ldquo;Severe fever&rdquo;, &ldquo;Bike issue&rdquo;) so the CEO can review it at month-end and grant concession.
                  </p>

                  <div className="relative">
                    <input
                      type="text"
                      maxLength={25}
                      value={employeeNoteInput}
                      onChange={(e) => setEmployeeNoteInput(e.target.value.slice(0, 25))}
                      placeholder="e.g. Severe fever, Bike issue"
                      className="w-full px-3 py-2 pr-12 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-500">
                      {employeeNoteInput.length}/25
                    </span>
                  </div>

                  {noteMsg && (
                    <p className={`text-[11px] font-semibold ${noteMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {noteMsg.text}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {selectedDayDetail.record?.employeeNote && (
                      <button
                        type="button"
                        onClick={handleDeleteEmployeeNote}
                        disabled={savingNote}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        Delete Note
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveEmployeeNote}
                      disabled={savingNote}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {savingNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDayDetail(null)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              /* ========================================================================= */
              /* 3. MANAGEMENT / CEO VIEW: REVIEW EMPLOYEE NOTE, CONCESSION & EDIT FORM */
              /* ========================================================================= */
              <div className="space-y-4">
                {/* Employee Short Note Review Box */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span>💬</span> Employee Short Reason Note:
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">Max 25c</span>
                  </div>
                  {selectedDayDetail.record?.employeeNote ? (
                    <p className="text-sm font-bold text-amber-300 p-2 bg-amber-950/30 rounded-xl border border-amber-800/40 mt-1">
                      &ldquo;{selectedDayDetail.record.employeeNote}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic mt-1">
                      No reason note submitted by employee for this date.
                    </p>
                  )}
                </div>

                {/* CEO Executive Concession Box */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    selectedDayDetail.record?.hasConcession
                      ? 'bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border-purple-500 shadow-md shadow-purple-950/40'
                      : 'bg-purple-950/20 border-purple-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎁</span>
                      <div>
                        <h4 className="text-xs font-black text-purple-200">
                          Executive Concession (Waive Salary Cut)
                        </h4>
                        <p className="text-[10px] text-purple-300/80">
                          Exempts this off/half leave day from salary penalty
                        </p>
                      </div>
                    </div>
                    {selectedDayDetail.record?.hasConcession ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                        None
                      </span>
                    )}
                  </div>

                  {concessionError && (
                    <p className="text-xs text-rose-400 mt-2 font-semibold">{concessionError}</p>
                  )}

                  {selectedDayDetail.record?.hasConcession ? (
                    <div className="mt-3 pt-3 border-t border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[11px] text-purple-200">
                        <span className="text-purple-400 font-bold">Reason:</span> &ldquo;{selectedDayDetail.record.concessionReason || 'Approved by Executive Management'}&rdquo;
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleConcession(false)}
                        disabled={savingConcession}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800 cursor-pointer self-start sm:self-auto transition-colors disabled:opacity-50"
                      >
                        {savingConcession ? 'Revoking...' : 'Revoke Concession'}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-purple-800/40 space-y-2">
                      <input
                        type="text"
                        value={concessionReasonInput}
                        onChange={(e) => setConcessionReasonInput(e.target.value)}
                        placeholder="Concession reason (e.g. Medical emergency approved by CEO)"
                        className="w-full px-3 py-2 bg-slate-900 border border-purple-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleToggleConcession(true)}
                        disabled={savingConcession}
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-900/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <span>🎁</span>
                        <span>{savingConcession ? 'Granting...' : 'Grant Concession (Pardon Day & Waive Cut)'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                    Attendance Status
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
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
                      onClick={() => setEditStatus('WFH')}
                      className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        editStatus === 'WFH'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      🏡 WFH
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

                {/* Admin Register Notes Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Register Notes / Management Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adjusted by admin, shift delay, client site visit..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* GPS Location Links if recorded */}
                {(selectedDayDetail.record?.location?.latitude || selectedDayDetail.record?.checkOutLocation?.latitude) && (
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      Recorded GPS Location:
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedDayDetail.record?.location?.latitude && (
                        <a
                          href={`https://www.google.com/maps?q=${selectedDayDetail.record.location.latitude},${selectedDayDetail.record.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 border border-orange-800/60 font-bold text-[11px] flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          Check-In Pin
                        </a>
                      )}
                      {selectedDayDetail.record?.checkOutLocation?.latitude && (
                        <a
                          href={`https://www.google.com/maps?q=${selectedDayDetail.record.checkOutLocation.latitude},${selectedDayDetail.record.checkOutLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 font-bold text-[11px] flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          Check-Out Pin
                        </a>
                      )}
                    </div>
                  </div>
                )}

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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
