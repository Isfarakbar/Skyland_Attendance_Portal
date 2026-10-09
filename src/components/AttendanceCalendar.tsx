'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, AlertCircle, User as UserIcon } from 'lucide-react';

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
  const isManagement = ['developer', 'admin', 'manager'].includes(userRole);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);
  const [employeesList, setEmployeesList] = useState<{ _id: string; name: string; employeeId: string; baseSalary?: number }[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ date: string; record: AttendanceRecord | null } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Fetch employees list if management
  useEffect(() => {
    if (isManagement) {
      fetch('/api/employees')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.employees) {
            setEmployeesList(data.employees);
          }
        })
        .catch(() => {});
    }
  }, [isManagement]);

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

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // In JS getDay(): 0 is Sunday, 1 is Monday... let's shift so Monday is 0 and Sunday is 6
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

  const selectedEmployee = employeesList.find((e) => e._id === selectedUserId);
  const baseSalary = selectedEmployee?.baseSalary || 30000;
  const dailyRate = Math.round(baseSalary / 30);
  const halfDayRate = Math.round(dailyRate / 2);

  const excessOffs = Math.max(0, totalOffs - 1);
  const excessHalfLeaves = Math.max(0, totalHalfLeaves - 1);
  const deductions = (excessOffs * dailyRate) + (excessHalfLeaves * halfDayRate);
  const netEstimatedSalary = Math.max(0, baseSalary - deductions);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              Monthly Attendance Calendar
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual overview of marked attendance, working hours, and leave allowances
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* If management, employee selector */}
            {isManagement && employeesList.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {employeesList.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Current Month
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Days Present</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{presentDays} days</div>
            {lateDays > 0 && (
              <div className="text-[10px] text-amber-700 font-medium">({lateDays} late entries)</div>
            )}
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Offs Taken</div>
            <div className="text-xl font-black text-rose-700 mt-0.5">{totalOffs} <span className="text-xs font-normal">/ 1 Free</span></div>
            <div className="text-[10px] text-rose-600 font-semibold">
              {excessOffs > 0 ? `${excessOffs} excess (-PKR ${(excessOffs * dailyRate).toLocaleString()})` : 'Within free allowance'}
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Half Leaves</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{totalHalfLeaves} <span className="text-xs font-normal">/ 1 Free</span></div>
            <div className="text-[10px] text-amber-600 font-semibold">
              {excessHalfLeaves > 0 ? `${excessHalfLeaves} excess (-PKR ${(excessHalfLeaves * halfDayRate).toLocaleString()})` : 'Within free allowance'}
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
            <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Est. Net Pay</div>
            <div className="text-xl font-black text-indigo-700 mt-0.5">PKR {netEstimatedSalary.toLocaleString()}</div>
            <div className="text-[10px] text-indigo-600 font-medium">
              Base: PKR {baseSalary.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">Loading calendar data...</div>
        ) : (
          <div>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div className="text-rose-400">Sun</div>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty padding slots before first day */}
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="min-h-24 rounded-2xl bg-slate-50/40 border border-dashed border-slate-100" />
              ))}

              {/* Day slots */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const dayNumber = index + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                const cellDate = new Date(year, month, dayNumber);
                const isSunday = cellDate.getDay() === 0;
                const record = recordsMap.get(dateKey);

                let cellBg = 'bg-white border-slate-200/80 hover:border-slate-300';
                let badge = null;

                if (isSunday) {
                  cellBg = 'bg-slate-50/60 border-slate-100';
                }

                if (record) {
                  if (record.status === 'PRESENT') {
                    cellBg = 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300';
                    badge = (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          Present
                        </span>
                        {record.clockIn && (
                          <div className="text-[10px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                        )}
                      </div>
                    );
                  } else if (record.status === 'LATE') {
                    cellBg = 'bg-amber-50/40 border-amber-200 hover:border-amber-300';
                    badge = (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 text-amber-800">
                          Late
                        </span>
                        {record.clockIn && (
                          <div className="text-[10px] font-mono text-amber-700 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                        )}
                      </div>
                    );
                  } else if (record.status === 'HALF_LEAVE' || record.status === 'HALF_DAY') {
                    cellBg = 'bg-orange-50/40 border-orange-200 hover:border-orange-300';
                    badge = (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-orange-100 text-orange-800">
                          Half Leave
                        </span>
                      </div>
                    );
                  } else if (record.status === 'OFF' || record.status === 'ABSENT' || record.status === 'ON_LEAVE') {
                    cellBg = 'bg-rose-50/40 border-rose-200 hover:border-rose-300';
                    badge = (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-[10px] bg-rose-100 text-rose-800">
                          Off
                        </span>
                      </div>
                    );
                  }
                } else if (isSunday) {
                  badge = (
                    <div className="mt-1">
                      <span className="inline-block px-1.5 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 text-slate-400">
                        Weekend
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDayDetail({ date: dateKey, record: record || null })}
                    className={`min-h-24 p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${cellBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSunday ? 'text-rose-500' : 'text-slate-800'}`}>
                        {dayNumber}
                      </span>
                      {record?.notes && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Has notes" />
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
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="font-bold text-slate-700">Legend:</span>
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
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span>Weekend / Off Day</span>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Attendance Details
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{selectedDayDetail.date}</p>

            {selectedDayDetail.record ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-slate-900">{selectedDayDetail.record.status}</span>
                </div>
                {selectedDayDetail.record.clockIn && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Time In</span>
                    <span className="font-mono font-bold text-slate-900">
                      {new Date(selectedDayDetail.record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {selectedDayDetail.record.clockOut && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Time Out</span>
                    <span className="font-mono font-bold text-slate-900">
                      {new Date(selectedDayDetail.record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {selectedDayDetail.record.notes && (
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block mb-1">Notes / Reason:</span>
                    <span className="text-slate-800">{selectedDayDetail.record.notes}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No attendance record marked for this date.
              </div>
            )}

            <button
              onClick={() => setSelectedDayDetail(null)}
              className="mt-5 w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
