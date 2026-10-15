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
        badgeBg: 'bg-slate-900 text-slate-400 border-slate-800',
        dotBg: 'bg-slate-500',
        title: 'Pending Punch',
        description: 'Office attendance is automatically recorded when you scan your fingerprint at reception.',
      };
    }

    switch (status) {
      case 'PRESENT':
        return {
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          dotBg: 'bg-emerald-400',
          title: 'Marked Present',
          description: 'Checked in successfully today at Skyland Energy Head Office.',
        };
      case 'LATE':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          dotBg: 'bg-amber-400',
          title: 'Marked Late',
          description: 'Arrival recorded after the official office start time.',
        };
      case 'HALF_LEAVE':
      case 'HALF_DAY':
        return {
          badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          dotBg: 'bg-orange-400',
          title: 'Marked Half Leave',
          description: 'Recorded as half-day. (1 free half leave allowed per month).',
        };
      case 'OFF':
      case 'ABSENT':
      case 'ON_LEAVE':
        return {
          badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          dotBg: 'bg-rose-400',
          title: 'Marked Off / Absent',
          description: 'Recorded as full off day. (1 free off day allowed per month).',
        };
      default:
        return {
          badgeBg: 'bg-slate-900 text-slate-400 border-slate-800',
          dotBg: 'bg-slate-500',
          title: status,
          description: 'Attendance recorded on portal.',
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
    <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
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

          <h3 className="text-xl font-black text-white tracking-tight">
            {statusInfo.title}
          </h3>
          <p className="text-xs text-slate-400">
            {statusInfo.description}
          </p>

          {/* Time In / Out metadata */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            {clockInFormatted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
                <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span className="text-slate-500">Time In:</span>
                <span className="font-bold text-white font-mono">{clockInFormatted}</span>
              </div>
            )}

            {clockOutFormatted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-500">Time Out:</span>
                <span className="font-bold text-white font-mono">{clockOutFormatted}</span>
              </div>
            )}

            {attendance?.notes && (
              <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs">
                <span className="font-semibold text-slate-400">Note:</span> {attendance.notes}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Policy Info Banner */}
        <div className="w-full md:w-auto shrink-0 p-4 bg-[#131E36] border border-slate-800 rounded-2xl md:max-w-xs text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
            <span>Attendance Policy</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Attendance is recorded directly via biometric fingerprint or live site GPS.
            Policy: <strong className="text-slate-200">1 free off</strong> and <strong className="text-slate-200">1 free half leave</strong> per month. Excess leaves deducted at per-day income rate (Pay ÷ 30).
          </p>
        </div>
      </div>
    </div>
  );
}
