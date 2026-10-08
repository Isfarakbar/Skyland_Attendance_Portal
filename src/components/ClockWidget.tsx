'use client';

import React, { useState, useEffect } from 'react';
import { Play, Square, Coffee, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface ClockWidgetProps {
  todayData: {
    state: string; // 'NOT_CLOCKED_IN' | 'WORKING' | 'ON_BREAK' | 'CLOCKED_OUT'
    attendance: any;
    currentBreak: any;
    totalBreakMinutes: number;
    settings: any;
  } | null;
  onRefresh: () => void;
}

export default function ClockWidget({ todayData, onRefresh }: ClockWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [breakReason, setBreakReason] = useState('Lunch');
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer for active work duration
  useEffect(() => {
    if (!todayData?.attendance?.clockIn || todayData.state === 'CLOCKED_OUT') {
      return;
    }

    const clockInTime = new Date(todayData.attendance.clockIn).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - clockInTime) / 1000));
      // subtract break minutes converted to seconds
      const netSecs = Math.max(0, diffSecs - (todayData.totalBreakMinutes || 0) * 60);
      setElapsedSeconds(netSecs);
    }, 1000);

    return () => clearInterval(interval);
  }, [todayData]);

  const formatElapsed = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handlePunchIn = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/punch-in', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Failed to punch in');
      onRefresh();
    } catch {
      alert('Network error while clocking in');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!confirm('Are you sure you want to clock out for today?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/punch-out', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Failed to punch out');
      onRefresh();
    } catch {
      alert('Network error while clocking out');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBreak = async (action: 'start' | 'end') => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: breakReason }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Failed to update break');
      setShowBreakModal(false);
      onRefresh();
    } catch {
      alert('Network error while updating break');
    } finally {
      setLoading(false);
    }
  };

  const state = todayData?.state || 'NOT_CLOCKED_IN';
  const attendance = todayData?.attendance;
  const isLate = attendance?.status === 'LATE';

  return (
    <div className="relative overflow-hidden bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
      {/* Top subtle decorative pattern */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-gradient-to-br from-indigo-100/60 to-purple-100/30 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Status & Live Metrics */}
        <div className="space-y-3 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <span className="flex h-3 w-3 relative">
              {state === 'WORKING' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              {state === 'ON_BREAK' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  state === 'WORKING'
                    ? 'bg-emerald-500'
                    : state === 'ON_BREAK'
                    ? 'bg-amber-500'
                    : state === 'CLOCKED_OUT'
                    ? 'bg-slate-400'
                    : 'bg-indigo-500'
                }`}
              ></span>
            </span>

            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
              {state === 'WORKING' && 'Currently Clocked In'}
              {state === 'ON_BREAK' && 'Currently on Break'}
              {state === 'CLOCKED_OUT' && 'Shift Completed'}
              {state === 'NOT_CLOCKED_IN' && 'Ready to Clock In'}
            </span>

            {isLate && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Marked Late
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {state === 'WORKING' && (
                <span className="font-mono text-indigo-600">{formatElapsed(elapsedSeconds)}</span>
              )}
              {state === 'ON_BREAK' && (
                <span className="font-mono text-amber-600">On Break ({todayData?.currentBreak?.note || 'Break'})</span>
              )}
              {state === 'CLOCKED_OUT' && (
                <span>
                  {(attendance?.totalWorkMinutes / 60).toFixed(1)} hrs{' '}
                  <span className="text-base text-slate-500 font-normal">Worked Today</span>
                </span>
              )}
              {state === 'NOT_CLOCKED_IN' && 'Not Clocked In Yet'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {attendance?.clockIn
                ? `Clocked in at ${format(new Date(attendance.clockIn), 'hh:mm:ss a')}`
                : `Official Shift: ${todayData?.settings?.officeStartTime || '09:00 AM'} — ${todayData?.settings?.officeEndTime || '06:00 PM'}`}
            </p>
          </div>

          {/* Punch details tags */}
          {attendance && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-xs text-slate-600">
              {attendance.clockOut && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Clocked Out: {format(new Date(attendance.clockOut), 'hh:mm:ss a')}
                </span>
              )}
              {todayData?.totalBreakMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-medium">
                  <Coffee className="w-3.5 h-3.5" />
                  Total Break: {todayData.totalBreakMinutes} mins
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Interactive Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center">
          {state === 'NOT_CLOCKED_IN' && (
            <button
              onClick={handlePunchIn}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Clock In Now</span>
            </button>
          )}

          {state === 'WORKING' && (
            <>
              <button
                onClick={() => setShowBreakModal(true)}
                disabled={loading}
                className="px-5 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold rounded-2xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>Take Break</span>
              </button>

              <button
                onClick={handlePunchOut}
                disabled={loading}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-md shadow-red-200 hover:shadow-red-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Clock Out</span>
              </button>
            </>
          )}

          {state === 'ON_BREAK' && (
            <button
              onClick={() => handleToggleBreak('end')}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>End Break & Resume Work</span>
            </button>
          )}

          {state === 'CLOCKED_OUT' && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Attendance Recorded for Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Break Selection Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Take a Break</h3>
                <p className="text-xs text-slate-500">Choose break reason to pause work timer</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {['Lunch Break', 'Tea / Coffee', 'Personal / Errand', 'Prayer / Rest'].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setBreakReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    breakReason === reason
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleBreak('start')}
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs"
              >
                Start Break
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
