'use client';

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Palmtree,
  ArrowUpRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import FieldCheckInWidget from '@/components/FieldCheckInWidget';
import DailyTaskSection from '@/components/DailyTaskSection';

interface EmployeeDashboardViewProps {
  user: any;
  todayData: any;
  employeeStats: any;
  onOpenCompleteProfile: () => void;
  onOpenTab: (tab: string) => void;
  onRefresh: () => void;
}

export default function EmployeeDashboardView({
  user,
  todayData,
  employeeStats,
  onOpenCompleteProfile,
  onOpenTab,
  onRefresh,
}: EmployeeDashboardViewProps) {
  const attendance = todayData?.attendance;
  const isCheckedIn = !!attendance?.clockIn;
  const isCheckedOut = !!attendance?.clockOut;

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const baseSalary = typeof user?.baseSalary === 'number' && user.baseSalary > 0
    ? user.baseSalary
    : (typeof employeeStats?.baseSalary === 'number' && employeeStats.baseSalary > 0 ? employeeStats.baseSalary : 0);
  const netSalary = employeeStats?.netSalary ?? baseSalary;
  const presentDays = employeeStats?.presentDays ?? (isCheckedIn ? 1 : 0);
  const lateDays = employeeStats?.lateDays ?? (attendance?.status === 'LATE' ? 1 : 0);
  const remainingLeaveBalance = employeeStats?.remainingLeaveBalance ?? 1.5;
  const cumulativeAccruedLeaves = employeeStats?.cumulativeAccruedLeaves ?? 1.5;

  // Privacy mask: pay/wage is hidden by default (like banking apps), revealable via Eye icon
  const [showPay, setShowPay] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. TOP METRIC CARDS (2x2 APP-STYLE GRID ON MOBILE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Today's Status */}
        <div
          className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-xs transition-all ${
            isCheckedIn
              ? attendance?.status === 'LATE'
                ? 'bg-amber-950/30 border-amber-800/80'
                : 'bg-emerald-950/30 border-emerald-800/80'
              : 'bg-[#131E36] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Today
            </span>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
                isCheckedIn
                  ? attendance?.status === 'LATE'
                    ? 'bg-amber-900/60 text-amber-300'
                    : 'bg-emerald-900/60 text-emerald-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p
            className={`text-base sm:text-xl font-black mt-2 truncate ${
              isCheckedIn
                ? attendance?.status === 'LATE'
                  ? 'text-amber-300'
                  : 'text-emerald-400'
                : 'text-slate-300'
            }`}
          >
            {isCheckedIn
              ? attendance?.status === 'LATE'
                ? 'Late In'
                : 'Checked In'
              : 'Pending'}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            {isCheckedIn ? formatTime(attendance?.clockIn) : 'Not punched yet'}
          </p>
        </div>

        {/* Card 2: Monthly Attendance */}
        <div className="bg-[#131E36] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              This Month
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 text-orange-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-white mt-2">
            {presentDays} Days
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            {lateDays > 0 ? `${lateDays} Late (No Fine)` : '100% Punctual'}
          </p>
        </div>

        {/* Card 3: Annual Leave Balance (18 Yearly Quota: 1 full + 1 half/mo carry-forward) */}
        <div className="bg-[#131E36] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Leave Balance
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center">
              <Palmtree className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-sky-400 mt-2">
            {remainingLeaveBalance} Days
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            {cumulativeAccruedLeaves} / 18 Accrued
          </p>
        </div>

        {/* Card 4: Estimated Wage (Hidden by default, revealable with Eye icon) */}
        <div className="bg-[#131E36] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Est. Salary
            </span>
            <button
              type="button"
              onClick={() => setShowPay((prev) => !prev)}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title={showPay ? 'Hide salary' : 'View salary'}
            >
              {showPay ? (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          </div>

          <div
            onClick={() => setShowPay((prev) => !prev)}
            className="cursor-pointer select-none"
          >
            <p className="text-base sm:text-xl font-black text-white mt-2 tracking-tight truncate">
              {showPay ? `PKR ${netSalary.toLocaleString()}` : '••••••••'}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
              {showPay ? (baseSalary > 0 ? `Base: ${baseSalary.toLocaleString()}` : 'Configured') : 'Tap to reveal'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TODAY'S ATTENDANCE SECTION (UNIFIED LIVE GPS SELF-ATTENDANCE) */}
      {/* ========================================================================= */}
      <FieldCheckInWidget todayData={todayData} onRefresh={onRefresh} />

      {/* ========================================================================= */}
      {/* 5. DAILY TASK SUBMISSIONS (DIRECT COMPONENT - NO DOUBLE NESTING) */}
      {/* ========================================================================= */}
      <DailyTaskSection userId={user?._id || user?.id} />

      {/* ========================================================================= */}
      {/* 6. COMPACT PROFILE & JOB OVERVIEW */}
      {/* ========================================================================= */}
      <div className="bg-[#131E36] rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-slate-700">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">{user?.name}</h3>
              <p className="text-xs text-slate-400">
                {user?.designation || 'Staff Member'} • {user?.department || 'Operations'} •{' '}
                <span className="font-mono text-orange-400">{user?.employeeId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCompleteProfile}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>View Full Profile &amp; Devices</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Employment</span>
            <span className="text-white font-bold">{user?.employmentType || 'Permanent'}</span>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Reporting To</span>
            <span className="text-white font-bold">{user?.reportingManager || 'CEO'}</span>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Registered Devices</span>
            <span className="text-orange-400 font-bold font-mono">
              {(user?.devices?.length || user?.assignedDevices?.length)
                ? `${user?.devices?.length || user?.assignedDevices?.length} Assigned`
                : 'None'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Phone Contact</span>
            <span className="text-slate-300 font-mono">{user?.phone || 'Not provided'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
