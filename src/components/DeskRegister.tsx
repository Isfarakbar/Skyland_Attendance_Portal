'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Save,
  Search,
  AlertCircle,
  Check,
  HelpCircle,
  MapPin,
  ExternalLink,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { AttendanceStatus } from '@/models/Attendance';
import EmployeeProfileModal from '@/components/EmployeeProfileModal';

interface RegisterEmployee {
  userId: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  baseSalary: number;
  workMode?: 'OFFICE' | 'FIELD';
  isFieldCheckIn?: boolean;
  location?: { latitude?: number; longitude?: number; siteName?: string; accuracy?: number } | null;
  status: AttendanceStatus | null;
  clockInTime: string;
  clockOutTime: string;
  notes: string;
  isSaved: boolean;
  isDirty?: boolean;
}

export default function DeskRegister() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [employees, setEmployees] = useState<RegisterEmployee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [inspectingEmpId, setInspectingEmpId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegister(date);
  }, [date]);

  const fetchRegister = async (targetDate: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/attendance/desk-register?date=${targetDate}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(
          data.employees.map((e: RegisterEmployee) => ({
            ...e,
            isDirty: false,
          }))
        );
      } else {
        setMessage({ text: data.error || 'Failed to load register', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error connecting to server', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (userId: string, newStatus: AttendanceStatus) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.userId !== userId) return emp;

        // Toggle off if clicking the already selected status
        if (emp.status === newStatus) {
          return {
            ...emp,
            status: null,
            clockInTime: '',
            clockOutTime: '',
            isDirty: true,
          };
        }

        let updatedIn = emp.clockInTime;
        let updatedOut = emp.clockOutTime;

        if (newStatus === 'OFF') {
          updatedIn = '';
          updatedOut = '';
        } else if (!updatedIn) {
          updatedIn = newStatus === 'LATE' ? '09:45' : '09:00';
        }

        return {
          ...emp,
          status: newStatus,
          clockInTime: updatedIn,
          clockOutTime: updatedOut,
          isDirty: true,
        };
      })
    );
  };

  const handleTimeInChange = (userId: string, value: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.userId === userId ? { ...emp, clockInTime: value, isDirty: true } : emp))
    );
  };

  const handleTimeOutChange = (userId: string, value: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.userId === userId ? { ...emp, clockOutTime: value, isDirty: true } : emp))
    );
  };

  const handleNotesChange = (userId: string, value: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.userId === userId ? { ...emp, notes: value, isDirty: true } : emp))
    );
  };

  const handleShiftDate = (days: number) => {
    try {
      const parts = date.split('-').map(Number);
      const current = new Date(parts[0], parts[1] - 1, parts[2]);
      current.setDate(current.getDate() + days);
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      setDate(`${y}-${m}-${d}`);
    } catch {
      // fallback
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setDate(today.toISOString().split('T')[0]);
  };

  const handleJumpToYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSaveSingleEmployee = async (emp: RegisterEmployee) => {
    if (!emp.status) {
      setMessage({
        text: `Please select a status (Present, Late, Half Leave, or Off) for ${emp.name} before saving.`,
        type: 'error',
      });
      return;
    }

    setSavingUserId(emp.userId);
    setMessage(null);
    try {
      const isOff = emp.status === 'OFF';
      const res = await fetch('/api/attendance/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: emp.userId,
          date,
          clockIn: isOff ? null : (emp.clockInTime || null),
          clockOut: isOff ? null : (emp.clockOutTime || null),
          status: emp.status,
          notes: emp.notes?.trim() || '',
          regularizedReason: `Desk register entry for ${date} by Management`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Attendance saved for ${emp.name} on ${date}!`, type: 'success' });
        setEmployees((prev) =>
          prev.map((e) => (e.userId === emp.userId ? { ...e, isSaved: true, isDirty: false } : e))
        );
      } else {
        setMessage({ text: data.error || 'Failed to save attendance', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error connecting to server', type: 'error' });
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDeleteRecord = async (userId: string, empName: string) => {
    if (!confirm(`Are you sure you want to delete and reset the attendance record of ${empName} for ${date}?`)) return;
    try {
      const res = await fetch(`/api/attendance/adjust?userId=${userId}&date=${date}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Attendance record deleted for ${empName} on ${date}`, type: 'success' });
      } else {
        setMessage({ text: `Cleared entry for ${empName}`, type: 'success' });
      }
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.userId === userId
            ? { ...emp, status: null, clockInTime: '', clockOutTime: '', notes: '', isSaved: false, isDirty: false }
            : emp
        )
      );
    } catch {
      setMessage({ text: 'Error resetting record', type: 'error' });
    }
  };

  const handleSaveRegister = async () => {
    // Only save employees who have an explicit status selected (never auto-mark unmarked as present)
    const markedEmployees = employees.filter((e) => e.status !== null);

    if (markedEmployees.length === 0) {
      setMessage({
        text: 'No attendance marked yet. Please select a status (Present, Late, Half Leave, or Off) for at least one employee.',
        type: 'error',
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payloadEntries = markedEmployees.map((emp) => ({
        userId: emp.userId,
        status: emp.status!,
        clockInTime: emp.status === 'OFF' ? '' : (emp.clockInTime || ''),
        clockOutTime: emp.status === 'OFF' ? '' : (emp.clockOutTime || ''),
        notes: emp.notes?.trim() || '',
      }));

      const res = await fetch('/api/attendance/desk-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, entries: payloadEntries }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          text: `Successfully saved ${markedEmployees.length} staff attendance record(s) for ${date}!`,
          type: 'success',
        });
        fetchRegister(date);
      } else {
        setMessage({ text: data.error || 'Failed to save register', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error saving register', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = employees.filter((e) => e.status === 'PRESENT').length;
  const lateCount = employees.filter((e) => e.status === 'LATE').length;
  const halfLeaveCount = employees.filter((e) => e.status === 'HALF_LEAVE' || e.status === 'HALF_DAY').length;
  const offCount = employees.filter((e) => e.status === 'OFF' || e.status === 'ABSENT').length;
  const unmarkedCount = employees.filter((e) => !e.status).length;

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950 text-orange-400 border border-orange-800 mb-2">
              <Clock className="w-3.5 h-3.5" />
              Master Attendance Register
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Daily &amp; Historical Attendance Register</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any past or current date to record or update staff attendance, check-in, and check-out times.
            </p>
          </div>

          {/* Quick Date Shift & Batch Save */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleJumpToYesterday}
              type="button"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-all cursor-pointer"
            >
              Yesterday
            </button>

            <button
              onClick={handleJumpToToday}
              type="button"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-orange-400 text-xs font-bold rounded-xl border border-slate-800 transition-all cursor-pointer"
            >
              Today
            </button>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
              <button
                onClick={() => handleShiftDate(-1)}
                type="button"
                className="w-7 h-7 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white px-2 focus:outline-hidden cursor-pointer"
              />

              <button
                onClick={() => handleShiftDate(1)}
                type="button"
                className="w-7 h-7 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSaveRegister}
              disabled={saving || loading}
              className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Marked Staff</span>
            </button>
          </div>
        </div>

        {/* Selected Date Indicator Banner */}
        <div className="pt-3 pb-1 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="font-extrabold text-white text-sm">
              {formatDateDisplay(date)}
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Company policy: 1 free Off &amp; 2 free Half Leaves / month
          </span>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Present</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{presentCount}</div>
          </div>
          <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-2xl">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Late</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{lateCount}</div>
          </div>
          <div className="p-3 bg-orange-950/40 border border-orange-800/80 rounded-2xl">
            <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Half Leave</div>
            <div className="text-xl font-black text-orange-300 mt-0.5">{halfLeaveCount}</div>
          </div>
          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-2xl">
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Off / Absent</div>
            <div className="text-xl font-black text-rose-300 mt-0.5">{offCount}</div>
          </div>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unmarked</div>
            <div className="text-xl font-black text-slate-300 mt-0.5">{unmarkedCount}</div>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'error'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Register List */}
      <div className="bg-[#131E36] border border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee by name, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing <span className="font-bold text-white">{filtered.length}</span> staff members
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading desk register...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No active employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Employee</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Time In</th>
                  <th className="pb-3 text-center">Time Out</th>
                  <th className="pb-3">Register Notes / Reason</th>
                  <th className="pb-3 text-right pr-2">Save / Reset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((emp) => {
                  const currentStatus = emp.status;
                  const isCurrentSaving = savingUserId === emp.userId;

                  return (
                    <tr key={emp.userId} className="hover:bg-slate-900/50 transition-colors">
                      {/* Employee Info */}
                      <td className="py-3 pl-2 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectingEmpId(emp.userId)}
                            className="font-bold text-white leading-tight hover:text-orange-400 hover:underline cursor-pointer text-left"
                            title="Click to view full progress, GPS & attendance"
                          >
                            {emp.name}
                          </button>
                          {emp.isDirty && (
                            <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes on this row" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-orange-400">{emp.employeeId}</span>
                          <span>•</span>
                          <span>{emp.designation}</span>
                        </div>
                        {emp.location?.latitude && emp.location?.longitude && (
                          <div className="mt-1 text-[10px] text-orange-400 flex items-center gap-1.5">
                            <span className="font-semibold">📍 {emp.location.siteName || 'GPS Self Check-In'}</span>
                            <a
                              href={`https://www.google.com/maps?q=${emp.location.latitude},${emp.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-orange-400 hover:underline font-bold"
                            >
                              [GPS Map]
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Status Selector Pills (Click active to toggle to Unmarked) */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.userId, 'PRESENT')}
                            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-emerald-400'
                            }`}
                            title="Present (Click again to unselect)"
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.userId, 'LATE')}
                            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-amber-400'
                            }`}
                            title="Late Arrival (Click again to unselect)"
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.userId, 'HALF_LEAVE')}
                            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                              currentStatus === 'HALF_LEAVE' || currentStatus === 'HALF_DAY'
                                ? 'bg-[#FF6B00] text-white shadow-xs'
                                : 'text-slate-400 hover:text-orange-400'
                            }`}
                            title="Half Leave (Click again to unselect)"
                          >
                            Half Leave
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.userId, 'OFF')}
                            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                              currentStatus === 'OFF' || currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-rose-400'
                            }`}
                            title="Off Day (Click again to unselect)"
                          >
                            Off
                          </button>
                        </div>
                      </td>

                      {/* Time In */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="time"
                          value={emp.clockInTime}
                          onChange={(e) => handleTimeInChange(emp.userId, e.target.value)}
                          disabled={currentStatus === 'OFF' || !currentStatus}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white disabled:opacity-30 focus:outline-hidden focus:ring-1 focus:ring-orange-500 font-mono"
                        />
                      </td>

                      {/* Time Out */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="time"
                          value={emp.clockOutTime}
                          onChange={(e) => handleTimeOutChange(emp.userId, e.target.value)}
                          disabled={currentStatus === 'OFF' || !currentStatus}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white disabled:opacity-30 focus:outline-hidden focus:ring-1 focus:ring-orange-500 font-mono"
                        />
                      </td>

                      {/* Notes / Reason */}
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          placeholder="e.g. Arrived on time / reason..."
                          value={emp.notes}
                          onChange={(e) => handleNotesChange(emp.userId, e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                        />
                      </td>

                      {/* Master / Admin Actions */}
                      <td className="py-3 pr-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Row-Level Save Button */}
                          <button
                            type="button"
                            onClick={() => handleSaveSingleEmployee(emp)}
                            disabled={isCurrentSaving || !emp.status}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              emp.isDirty && emp.status
                                ? 'bg-[#FF6B00] hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40'
                            }`}
                            title="Save this employee's attendance record immediately"
                          >
                            {isCurrentSaving ? (
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            <span>Save</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInspectingEmpId(emp.userId)}
                            className="p-1.5 text-orange-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Full 360 Progress & Attendance Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(emp.userId, emp.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete / Reset Attendance Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any selected status pill to unmark it. Save individual rows or batch via &quot;Save Marked Staff&quot;.</span>
          </div>

          <button
            onClick={handleSaveRegister}
            disabled={saving || loading}
            className="px-5 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2 self-end sm:self-auto"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Save Marked Staff Records for {date}</span>
          </button>
        </div>
      </div>

      {/* 360 Employee Dossier Modal */}
      {inspectingEmpId && (
        <EmployeeProfileModal
          employeeId={inspectingEmpId}
          onClose={() => setInspectingEmpId(null)}
        />
      )}
    </div>
  );
}
