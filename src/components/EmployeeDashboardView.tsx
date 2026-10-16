'use client';

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  MapPin,
  Calendar,
  DollarSign,
  Palmtree,
  CheckSquare,
  Edit3,
  Building,
  Briefcase,
  Laptop,
  ArrowUpRight,
  ShieldCheck,
  User,
  Plus,
  RefreshCw,
  AlertCircle,
  Zap,
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
  const isFieldWorker = user?.workMode === 'FIELD';
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

  const leaveBalance = user?.leaveBalance || { sick: 8, casual: 10, annual: 14 };
  const totalLeavesLeft =
    (leaveBalance.sick || 0) + (leaveBalance.casual || 0) + (leaveBalance.annual || 0);

  const baseSalary = typeof user?.baseSalary === 'number' && user.baseSalary > 0
    ? user.baseSalary
    : (typeof employeeStats?.baseSalary === 'number' && employeeStats.baseSalary > 0 ? employeeStats.baseSalary : 0);
  const netSalary = employeeStats?.netSalary ?? baseSalary;
  const presentDays = employeeStats?.presentDays ?? (isCheckedIn ? 1 : 0);
  const lateDays = employeeStats?.lateDays ?? (attendance?.status === 'LATE' ? 1 : 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. WELCOME HEADER & QUICK PROFILE BUTTON */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                isFieldWorker
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}
            >
              {isFieldWorker ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Site Solar Engineer
                </>
              ) : (
                <>
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  Office Staff Member
                </>
              )}
            </span>

            <span className="text-xs font-mono text-slate-400">
              Shift: {user?.shiftTiming || '09:00 AM - 06:00 PM'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Welcome back,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-orange-400">
              {user?.name ? user.name.split(' ')[0] : 'Team Member'}
            </span>{' '}
            👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isFieldWorker
              ? 'Mark your GPS site attendance and submit your daily project milestones.'
              : 'Scan your registered fingerprint upon arrival and keep your daily work logs updated.'}
          </p>
        </div>

        <button
          onClick={onOpenCompleteProfile}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 shadow-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Edit My Profile</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP METRIC CARDS (4 CLEAN CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today's Status */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition-all ${
            isCheckedIn
              ? attendance?.status === 'LATE'
                ? 'bg-amber-950/30 border-amber-800/80'
                : 'bg-emerald-950/30 border-emerald-800/80'
              : 'bg-[#131E36] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Today&apos;s Status
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isCheckedIn
                  ? attendance?.status === 'LATE'
                    ? 'bg-amber-900/60 text-amber-300'
                    : 'bg-emerald-900/60 text-emerald-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-xl sm:text-2xl font-black mt-2 truncate ${
              isCheckedIn
                ? attendance?.status === 'LATE'
                  ? 'text-amber-300'
                  : 'text-emerald-400'
                : 'text-slate-300'
            }`}
          >
            {isCheckedIn
              ? attendance?.status === 'LATE'
                ? 'Late Arrival'
                : 'Checked In'
              : 'Pending Punch'}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
            {isCheckedIn
              ? `Punched in at ${formatTime(attendance?.clockIn)}`
              : 'No punch recorded yet today'}
          </p>
        </div>

        {/* Card 2: Monthly Attendance */}
        <div className="bg-[#131E36] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              This Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-orange-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-2">
            {presentDays} Days
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {lateDays > 0 ? `${lateDays} late arrival${lateDays > 1 ? 's' : ''} (record only)` : 'Punctual record'}
          </p>
        </div>

        {/* Card 3: Leave Balance */}
        <div className="bg-[#131E36] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Leave Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-2">
            {totalLeavesLeft} Days Left
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
            {leaveBalance.sick || 8}S • {leaveBalance.casual || 10}C • {leaveBalance.annual || 14}A
          </p>
        </div>

        {/* Card 4: Estimated Salary */}
        <div className="bg-[#131E36] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Estimated Wage
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white mt-2">
            PKR {netSalary.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
            {baseSalary > 0 ? `Base: PKR ${baseSalary.toLocaleString()}` : 'Base: Not configured'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. QUICK ACTION BAR (FINGER-FRIENDLY SHORTCUTS) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onOpenTab('apps')}
          className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white text-xs font-bold rounded-2xl shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Submit Work Log</span>
        </button>

        <button
          onClick={() => onOpenTab('calendar')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>My Calendar</span>
        </button>

        <button
          onClick={() => onOpenTab('salary')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          <span>My Payslip</span>
        </button>

        <button
          onClick={() => onOpenTab('reviews')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Palmtree className="w-3.5 h-3.5 text-slate-400" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TODAY'S ATTENDANCE SECTION */}
      {/* ========================================================================= */}
      {isFieldWorker ? (
        /* Site Solar Employee: Live GPS Check-In Widget */
        <FieldCheckInWidget todayData={todayData} onRefresh={onRefresh} />
      ) : (
        /* Office Employee: Streamlined Biometric Card */
        <div className="bg-[#131E36] rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-950/80 text-orange-400 flex items-center justify-center shrink-0 border border-orange-800/80">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  Office Fingerprint Attendance
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Biometric Terminal • Auto-syncs via office network
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  isCheckedIn
                    ? attendance?.status === 'LATE'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {isCheckedIn
                  ? attendance?.status === 'LATE'
                    ? 'Late Arrival'
                    : 'Checked In'
                  : 'Pending Punch'}
              </span>
            </div>
          </div>

          {/* Punch In & Out Timeline Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Clock In
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">
                  {isCheckedIn ? formatTime(attendance?.clockIn) : '--:--'}
                </span>
                {isCheckedIn && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isCheckedIn ? 'Recorded successfully' : 'Scan fingerprint on arrival'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Clock Out
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">
                  {isCheckedOut ? formatTime(attendance?.clockOut) : '--:--'}
                </span>
                {isCheckedOut && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isCheckedOut ? 'Shift completed' : 'Scan fingerprint when leaving'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Assigned Shift
              </span>
              <span className="text-base font-extrabold text-white font-mono block">
                {user?.shiftTiming || '09:00 AM - 06:00 PM'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Biometric ID:{' '}
                <strong className="text-orange-400 font-mono">
                  {user?.biometricUserId || user?.employeeId || 'Assigned'}
                </strong>
              </p>
            </div>
          </div>

          {/* Office Biometric Terminal Notice */}
          <div className="pt-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">
                  Physical Biometric Terminal Verification
                </p>
                <p className="text-[11px] text-slate-400">
                  {isCheckedOut
                    ? 'Shift completed for today. Thank you for your work!'
                    : isCheckedIn
                    ? `Clocked in at ${formatTime(attendance?.clockIn)}. Punch on the office terminal when leaving.`
                    : `Please scan your registered fingerprint (Biometric ID #${user?.biometricUserId || user?.employeeId || 'Assigned'}) on the office Dahua machine.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-300 self-start sm:self-auto shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dahua ASA1222G Terminal</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DAILY TASK SUBMISSIONS (DIRECT COMPONENT - NO DOUBLE NESTING) */}
      {/* ========================================================================= */}
      <DailyTaskSection userId={user?._id} />

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
            <span className="text-white font-bold">{user?.reportingManager || 'Management'}</span>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Registered Devices</span>
            <span className="text-orange-400 font-bold font-mono">
              {user?.assignedDevices?.length ? `${user.assignedDevices.length} Assigned` : 'None'}
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
