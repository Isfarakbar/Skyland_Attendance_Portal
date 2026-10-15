'use client';

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  MapPin,
  Calendar,
  CheckSquare,
  Sparkles,
  Edit3,
  User,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Building,
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
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Employee Greeting & Work Mode Banner */}
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
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Welcome back,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-orange-400">
              {user?.name ? user.name.split(' ')[0] : 'Team Member'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isFieldWorker
              ? 'Mark your live GPS site attendance and submit your daily work milestones.'
              : 'Scan your fingerprint on the office Dahua machine and log your daily work achievements.'}
          </p>
        </div>

        <button
          onClick={onOpenCompleteProfile}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Edit My Profile</span>
        </button>
      </div>

      {/* Main 2-Column Grid: Attendance Widget + Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Attendance & Work Submission */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Attendance Card */}
          {isFieldWorker ? (
            /* Site Employee: GPS Field Check-In */
            <FieldCheckInWidget todayData={todayData} onRefresh={onRefresh} />
          ) : (
            /* Office Employee: Dahua Biometric Punch Status */
            <div className="bg-[#131E36] rounded-[32px] p-6 sm:p-7 border border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-950/80 text-orange-400 flex items-center justify-center shrink-0 border border-orange-800/80">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">
                      Office Fingerprint Attendance
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dahua ASA1222G Biometric Terminal (Reception)
                    </p>
                  </div>
                </div>

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

              {/* Punch State Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Today&apos;s Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {isCheckedIn ? `In at ${formatTime(attendance?.clockIn)}` : 'Not punched yet today'}
                    </span>
                    {isCheckedIn && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {isCheckedIn
                      ? isCheckedOut
                        ? `Checked out at ${formatTime(attendance?.clockOut)}`
                        : 'Currently active at Skyland Energy Head Office'
                      : 'Please scan your registered fingerprint at the reception terminal upon arrival.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenTab('calendar')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow-xs transition-all cursor-pointer"
                  >
                    View Calendar
                  </button>
                </div>
              </div>

              {/* Biometric machine ID info */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>
                  Registered Biometric ID:{' '}
                  <strong className="text-orange-400 font-mono">
                    {user?.biometricUserId || user?.employeeId || 'Assigned'}
                  </strong>
                </span>
                <span className="text-slate-500">Auto-syncs via office network</span>
              </div>
            </div>
          )}

          {/* 2. Daily Task Submission Section */}
          <div className="bg-[#131E36] rounded-[32px] p-6 sm:p-7 border border-slate-800 shadow-xs">
            <DailyTaskSection userId={user?._id} />
          </div>
        </div>

        {/* Right Column (4 cols): Profile Dossier Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#131E36] rounded-[32px] p-5 sm:p-6 border border-slate-800 shadow-xs space-y-5">
            {/* Portrait Image & Edit Pill */}
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-gradient-to-tr from-[#FF6B00] via-orange-500 to-indigo-900 flex flex-col justify-end p-4 group">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white text-5xl font-black">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-black/20" />

              <button
                onClick={onOpenCompleteProfile}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                title="Change Photo & Details"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Edit Profile</span>
              </button>

              <div className="relative z-10 text-white">
                <h3 className="font-black text-lg leading-tight drop-shadow-xs">{user?.name}</h3>
                <p className="text-xs text-slate-300 font-medium drop-shadow-xs mt-0.5">
                  {user?.designation || 'Team Member'}
                </p>
                <span className="text-[11px] font-mono text-orange-400">{user?.employeeId}</span>
              </div>
            </div>

            {/* Profile Detail Fields */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Department</span>
                <span className="font-extrabold text-white">{user?.department || 'Operations'}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Work Mode</span>
                <span className="font-extrabold text-white">
                  {isFieldWorker ? '📍 Solar Site / Field' : '🏢 Head Office'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Shift Timing</span>
                <span className="font-bold text-slate-300 font-mono">
                  {user?.shiftTiming || '09:00 AM - 06:00 PM'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Phone</span>
                <span className="font-bold text-slate-300 font-mono">
                  {user?.phone || 'Not provided'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Leave Balance</span>
                <span className="font-extrabold text-emerald-400">
                  {(user?.leaveBalance?.sick || 8) +
                    (user?.leaveBalance?.casual || 10) +
                    (user?.leaveBalance?.annual || 14)}{' '}
                  Days Left
                </span>
              </div>
            </div>

            <button
              onClick={onOpenCompleteProfile}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View Full Dossier (Bank, CNIC, Bio)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
