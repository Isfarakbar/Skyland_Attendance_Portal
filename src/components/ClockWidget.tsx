'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, AlertCircle, Calendar, ShieldCheck, Sun } from 'lucide-react';
import { format } from 'date-fns';

interface ClockWidgetProps {
  todayData: {
    state: string;
    attendance: any;
    settings: any;
    todayDate: string;
  } | null;
  onRefresh: () => void;
}

export default function ClockWidget({ todayData }: ClockWidgetProps) {
  const attendance = todayData?.attendance;
  const status = attendance?.status;

  const getStatusDisplay = () => {
    if (!attendance || !status) {
      return {
        badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        dotBg: 'bg-amber-400 animate-pulse',
        title: 'Pending Desk Entry',
        description: 'Office attendance is recorded daily on the desk register by Admin.',
      };
    }

    switch (status) {
      case 'PRESENT':
        return {
          badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dotBg: 'bg-emerald-400',
          title: 'Marked Present',
          description: 'Marked present on today\'s register by Operations Admin.',
        };
      case 'LATE':
        return {
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dotBg: 'bg-amber-400',
          title: 'Marked Late',
          description: 'Arrival recorded after the official office start time.',
        };
      case 'HALF_LEAVE':
      case 'HALF_DAY':
        return {
          badgeBg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
          dotBg: 'bg-orange-400',
          title: 'Marked Half Leave',
          description: 'Recorded as half-day. (1 free half leave allowed per month).',
        };
      case 'OFF':
      case 'ABSENT':
      case 'ON_LEAVE':
        return {
          badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dotBg: 'bg-rose-400',
          title: 'Marked Off / Absent',
          description: 'Recorded as full off day. (1 free off day allowed per month).',
        };
      default:
        return {
          badgeBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
          dotBg: 'bg-slate-400',
          title: status,
          description: 'Attendance recorded by desk reception.',
        };
    }
  };

  const statusInfo = getStatusDisplay();

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'hh:mm a');
    } catch {
      return null;
    }
  };

  const clockInFormatted = formatTime(attendance?.clockIn);
  const clockOutFormatted = formatTime(attendance?.clockOut);

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-7 shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Left Side: Status Info */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeBg}`}>
              <span className={`w-2 h-2 rounded-full ${statusInfo.dotBg}`} />
              {statusInfo.title}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              {todayData?.todayDate || 'Today'}
            </span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight">
            {statusInfo.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md">
            {statusInfo.description}
          </p>

          {/* Time In / Out metadata */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            {clockInFormatted && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 glass-card rounded-2xl text-slate-200">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400">Time In:</span>
                <span className="font-bold text-white font-mono">{clockInFormatted}</span>
              </div>
            )}

            {clockOutFormatted && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 glass-card rounded-2xl text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Time Out:</span>
                <span className="font-bold text-white font-mono">{clockOutFormatted}</span>
              </div>
            )}

            {attendance?.notes && (
              <div className="px-3.5 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-200 text-xs">
                <span className="font-bold text-orange-400">Desk Note:</span> {attendance.notes}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Policy Info Banner */}
        <div className="w-full md:w-auto shrink-0 p-4 sm:p-5 glass-card rounded-3xl md:max-w-xs text-xs space-y-2 border border-white/10">
          <div className="flex items-center gap-2 font-bold text-white">
            <div className="w-7 h-7 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Office Attendance Policy</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Reception desk marks your arrival daily. Each month includes <strong className="text-orange-300">1 free off</strong> and <strong className="text-orange-300">1 free half leave</strong>. Excess leaves are deducted from monthly pay.
          </p>
        </div>
      </div>
    </div>
  );
}
