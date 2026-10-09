'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, AlertCircle, Calendar, ShieldCheck, Info } from 'lucide-react';
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
  const status = attendance?.status; // 'PRESENT' | 'LATE' | 'HALF_LEAVE' | 'OFF' | 'ABSENT' | etc.

  const getStatusDisplay = () => {
    if (!attendance || !status) {
      return {
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        dotBg: 'bg-slate-400',
        title: 'Pending Desk Entry',
        description: 'The desk admin has not recorded today\'s attendance on the register yet.',
      };
    }

    switch (status) {
      case 'PRESENT':
        return {
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotBg: 'bg-emerald-500',
          title: 'Marked Present',
          description: 'Desk admin has marked you present on today\'s register.',
        };
      case 'LATE':
        return {
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          dotBg: 'bg-amber-500',
          title: 'Marked Late',
          description: 'Desk admin recorded arrival after the official office start time.',
        };
      case 'HALF_LEAVE':
      case 'HALF_DAY':
        return {
          badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
          dotBg: 'bg-orange-500',
          title: 'Marked Half Leave',
          description: 'Recorded as half-day. (1 free half leave allowed per month).',
        };
      case 'OFF':
      case 'ABSENT':
      case 'ON_LEAVE':
        return {
          badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
          dotBg: 'bg-rose-500',
          title: 'Marked Off / Absent',
          description: 'Recorded as full off day. (1 free off day allowed per month).',
        };
      default:
        return {
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
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
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Status Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeBg}`}>
              <span className={`w-2 h-2 rounded-full ${statusInfo.dotBg}`} />
              {statusInfo.title}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {todayData?.todayDate || 'Today'}
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {statusInfo.title}
          </h3>
          <p className="text-xs text-slate-500">
            {statusInfo.description}
          </p>

          {/* Time In / Out metadata */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            {clockInFormatted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-slate-400">Time In:</span>
                <span className="font-bold text-slate-900 font-mono">{clockInFormatted}</span>
              </div>
            )}

            {clockOutFormatted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-400">Time Out:</span>
                <span className="font-bold text-slate-900 font-mono">{clockOutFormatted}</span>
              </div>
            )}

            {attendance?.notes && (
              <div className="px-3 py-1.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-900 text-xs">
                <span className="font-semibold">Desk Note:</span> {attendance.notes}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Policy Info Banner */}
        <div className="w-full md:w-auto shrink-0 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl md:max-w-xs text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Desk Register Policy</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Attendance is recorded directly on the reception desk register.
            Each month allows <strong className="text-slate-700">1 free off</strong> and <strong className="text-slate-700">1 free half leave</strong>. Additional leaves are deducted from monthly pay.
          </p>
        </div>
      </div>
    </div>
  );
}
