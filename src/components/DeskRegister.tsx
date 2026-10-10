'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Save, Search, AlertCircle, Sparkles, Check, HelpCircle, MapPin, ExternalLink } from 'lucide-react';
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
        setEmployees(data.employees);
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
        // Auto-fill sensible default time if marked present/late and currently empty
        let updatedIn = emp.clockInTime;
        if (!updatedIn && (newStatus === 'PRESENT' || newStatus === 'LATE' || newStatus === 'HALF_LEAVE')) {
          updatedIn = newStatus === 'LATE' ? '09:45' : '09:00';
        }
        return {
          ...emp,
          status: newStatus,
          clockInTime: updatedIn,
        };
      })
    );
  };

  const handleTimeInChange = (userId: string, value: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.userId === userId ? { ...emp, clockInTime: value } : emp))
    );
  };

  const handleTimeOutChange = (userId: string, value: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.userId === userId ? { ...emp, clockOutTime: value } : emp))
    );
  };

  const handleNotesChange = (userId: string, value: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.userId === userId ? { ...emp, notes: value } : emp))
    );
  };

  const handleMarkAllPresent = () => {
    setEmployees((prev) =>
      prev.map((emp) => ({
        ...emp,
        status: emp.status || 'PRESENT',
        clockInTime: emp.clockInTime || '09:00',
      }))
    );
  };

  const handleSaveRegister = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payloadEntries = employees.map((emp) => ({
        userId: emp.userId,
        status: emp.status || 'PRESENT',
        clockInTime: emp.clockInTime || undefined,
        clockOutTime: emp.clockOutTime || undefined,
        notes: emp.notes || '',
      }));

      const res = await fetch('/api/attendance/desk-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, entries: payloadEntries }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Register successfully saved for ${date}!`, type: 'success' });
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

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <Clock className="w-3.5 h-3.5" />
              Main Desk Reception Register
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Daily Attendance Register</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin marks daily staff attendance directly. Company policy: 1 free Off and 1 free Half Leave per month.
            </p>
          </div>

          {/* Date Selector & Primary Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={handleMarkAllPresent}
              type="button"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Fill All Present
            </button>

            <button
              onClick={handleSaveRegister}
              disabled={saving || loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-xs shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2"
            >
              {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Register
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5">
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Present</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{presentCount}</div>
          </div>
          <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Late</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{lateCount}</div>
          </div>
          <div className="p-3 bg-orange-50/70 border border-orange-100 rounded-2xl">
            <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">Half Leave</div>
            <div className="text-xl font-black text-orange-700 mt-0.5">{halfLeaveCount}</div>
          </div>
          <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Off / Absent</div>
            <div className="text-xl font-black text-rose-700 mt-0.5">{offCount}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Unmarked</div>
            <div className="text-xl font-black text-slate-700 mt-0.5">{unmarkedCount}</div>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}
      </div>

      {/* Register List */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee by name, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing <span className="font-bold text-slate-700">{filtered.length}</span> staff members
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
                <tr className="border-b border-slate-200/70 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Employee</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Time In</th>
                  <th className="pb-3 text-center">Time Out</th>
                  <th className="pb-3">Register Notes / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => {
                  const currentStatus = emp.status || 'UNMARKED';
                  return (
                    <tr key={emp.userId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Employee Info */}
                      <td className="py-3 pl-2 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectingEmpId(emp.userId)}
                            className="font-bold text-slate-900 leading-tight hover:text-indigo-600 hover:underline cursor-pointer text-left"
                            title="Click to view full progress, GPS & attendance"
                          >
                            {emp.name}
                          </button>
                          {emp.workMode === 'FIELD' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <MapPin className="w-2.5 h-2.5 text-amber-600" /> Field
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{emp.employeeId}</span>
                          <span>•</span>
                          <span>{emp.designation}</span>
                        </div>
                        {emp.isFieldCheckIn && emp.location && (
                          <div className="mt-1 text-[10px] text-indigo-700 flex items-center gap-1.5">
                            <span className="font-semibold">Site: {emp.location.siteName || 'Solar Field'}</span>
                            {emp.location.latitude && emp.location.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${emp.location.latitude},${emp.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-indigo-600 hover:underline font-bold"
                              >
                                [GPS Map]
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Selector Pills */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/70">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.userId, 'PRESENT')}
                            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.userId, 'LATE')}
                            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                              currentStatus === 'LATE'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-amber-700'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.userId, 'HALF_LEAVE')}
                            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                              currentStatus === 'HALF_LEAVE' || currentStatus === 'HALF_DAY'
                                ? 'bg-orange-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-orange-700'
                            }`}
                          >
                            Half Leave
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp.userId, 'OFF')}
                            className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                              currentStatus === 'OFF' || currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-rose-700'
                            }`}
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
                          disabled={currentStatus === 'OFF' || currentStatus === 'ABSENT'}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 disabled:opacity-40 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Time Out */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="time"
                          value={emp.clockOutTime}
                          onChange={(e) => handleTimeOutChange(emp.userId, e.target.value)}
                          disabled={currentStatus === 'OFF' || currentStatus === 'ABSENT'}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 disabled:opacity-40 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Notes / Reason */}
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          placeholder="e.g. Arrived on time / reason..."
                          value={emp.notes}
                          onChange={(e) => handleNotesChange(emp.userId, e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Changes are stored when you click &quot;Save Register&quot;.</span>
          </div>
          <button
            onClick={handleSaveRegister}
            disabled={saving || loading}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Save Changes
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
