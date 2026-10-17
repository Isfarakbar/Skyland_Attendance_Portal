'use client';

import React, { useState } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Building,
  RefreshCw,
  Plus,
  Sliders,
  Calendar,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  UserX,
  Palmtree,
  ArrowUpRight,
  Fingerprint,
} from 'lucide-react';

interface AdminDashboardViewProps {
  stats: any;
  lateEmployees: any[];
  presentEmployees: any[];
  absentEmployees: any[];
  recentTasks: any[];
  onOpenTab: (tab: string) => void;
  onRefresh: () => void;
  onOpenAddEmployee?: () => void;
}

export default function AdminDashboardView({
  stats,
  lateEmployees,
  presentEmployees,
  absentEmployees,
  recentTasks,
  onOpenTab,
  onRefresh,
}: AdminDashboardViewProps) {
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Admin Master Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-orange-950/80 text-orange-300 border border-orange-800 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            Operations Master Command
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Skyland Energy Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Master control for manual desk attendance, live employee GPS check-ins, staff directory &amp; settings
          </p>
        </div>

        {/* Master Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenTab('hiring')}
            className="px-4 py-2.5 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] text-white text-xs font-bold rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Manual Desk Register</span>
          </button>

          <button
            onClick={() => onOpenTab('people')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Staff Profiles</span>
          </button>

          <button
            onClick={() => onOpenTab('settings')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={onRefresh}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-800 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Admin KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Active Employees */}
        <div className="bg-[#131E36] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">
            {stats?.totalEmployees || 0}
          </p>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Active registered employees
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-emerald-950/30 p-4 sm:p-5 rounded-3xl border border-emerald-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Present Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {stats?.presentToday || 0}
          </p>
          <div className="text-[11px] text-emerald-300 font-medium mt-1">
            Checked in today
          </div>
        </div>

        {/* Late Today */}
        <div className="bg-amber-950/30 p-4 sm:p-5 rounded-3xl border border-amber-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Late Arrivals</span>
            <div className="w-8 h-8 rounded-xl bg-amber-900/50 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-2">
            {stats?.lateToday || 0}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Arrived past shift start</p>
        </div>

        {/* Absent / Unreported */}
        <div className="bg-rose-950/20 p-4 sm:p-5 rounded-3xl border border-rose-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Absent Today</span>
            <div className="w-8 h-8 rounded-xl bg-rose-900/50 text-rose-400 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
            {stats?.absentToday || 0}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Not clocked in</p>
        </div>

        {/* Pending Leaves */}
        <div className="bg-purple-950/20 p-4 sm:p-5 rounded-3xl border border-purple-900/60 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Leaves</span>
            <div className="w-8 h-8 rounded-xl bg-purple-900/50 text-purple-400 flex items-center justify-center">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-300 mt-2">
            {stats?.pendingLeaves || 0}
          </p>
          <button
            onClick={() => onOpenTab('reviews')}
            className="text-[11px] text-orange-400 hover:underline font-bold mt-1 block"
          >
            Review applications →
          </button>
        </div>
      </div>

      {/* Main 2-Column Admin Grid: Desk Attendance Live + Daily Employee Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Today's Active Attendance Roster */}
        <div className="lg:col-span-7 bg-[#131E36] rounded-[32px] p-5 sm:p-6 border border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white tracking-tight">Today&apos;s Attendance Roster</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {presentEmployees.length} Present
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live GPS employee self-attendance &amp; manual desk entries
              </p>
            </div>

            <button
              onClick={() => onOpenTab('hiring')}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Full Desk Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {presentEmployees.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No employee attendance recorded yet today. Employees can mark attendance via the app (with GPS ON) or Admin can mark via &quot;Manual Desk Register&quot;.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 max-h-[460px] overflow-y-auto pr-1">
              {presentEmployees.map((record, i) => {
                const u = record.user;
                if (!u) return null;
                const isLate = record.status === 'LATE';
                const hasGps = record.location?.latitude && record.location?.longitude;

                return (
                  <div key={i} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.name?.charAt(0) || 'E'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-white truncate">{u.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{u.employeeId}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                          <span>
                            {hasGps
                              ? `📍 ${record.location?.siteName || 'GPS Self Check-In'}`
                              : '📋 Manual Desk Register'}
                          </span>
                          {hasGps && (
                            <a
                              href={`https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400 font-bold hover:underline"
                            >
                              View Map →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {formatTime(record.clockIn)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isLate ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {isLate ? 'Late' : 'Present'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Employee Daily Work Tasks Feed */}
        <div className="lg:col-span-5 bg-[#131E36] rounded-[32px] p-5 sm:p-6 border border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white tracking-tight">Staff Task Submissions</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {recentTasks.length} Today
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Work progress submitted by staff today
              </p>
            </div>

            <button
              onClick={() => onOpenTab('apps')}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No staff work tasks submitted yet today.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-xs text-white truncate">
                      {task.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : task.status === 'BLOCKED'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium text-slate-300">{task.user?.name}</span>
                    {task.hoursSpent ? (
                      <span className="font-mono font-bold text-slate-400">{task.hoursSpent} hrs</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
