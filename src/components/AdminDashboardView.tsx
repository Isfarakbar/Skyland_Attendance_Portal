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
  const [syncingDevice, setSyncingDevice] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleDeviceSync = async () => {
    setSyncingDevice(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/attendance/device-sync');
      const data = await res.json();
      if (data.success) {
        setSyncResult(`Machine online: ${data.message || 'Ready for punches'}`);
        onRefresh();
      } else {
        setSyncResult(data.error || 'Sync returned notice');
      }
    } catch {
      setSyncResult('Network error syncing biometric terminal');
    } finally {
      setSyncingDevice(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Operations Master Command
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Skyland Energy Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Master control for attendance registers, biometric device sync, employee directory &amp; settings
          </p>
        </div>

        {/* Master Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDeviceSync}
            disabled={syncingDevice}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xs shadow-emerald-200 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            title="Poll punches from Dahua ASA1222G terminal"
          >
            <Fingerprint className={`w-4 h-4 ${syncingDevice ? 'animate-spin' : ''}`} />
            <span>{syncingDevice ? 'Syncing...' : 'Sync Biometric Terminal'}</span>
          </button>

          <button
            onClick={() => onOpenTab('hiring')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Desk Register</span>
          </button>

          <button
            onClick={() => onOpenTab('people')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Staff Profiles</span>
          </button>

          <button
            onClick={() => onOpenTab('settings')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncResult}</span>
          </div>
          <span className="text-[10px] text-emerald-600">Dahua ASA1222G IP: 192.168.100.110:37777</span>
        </div>
      )}

      {/* Admin KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Active Employees */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {stats?.totalEmployees || 0}
          </p>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {stats?.officeTotal || 0} Office • {stats?.siteTotal || 0} Site
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-xs bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Present Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
            {stats?.presentToday || 0}
          </p>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {stats?.officePresent || 0} Office • {stats?.sitePresent || 0} Site
          </div>
        </div>

        {/* Late Today */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Late Arrivals</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-2">
            {stats?.lateToday || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Arrived past shift start</p>
        </div>

        {/* Absent / Unreported */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Absent Today</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
            {stats?.absentToday || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Not clocked in</p>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Leaves</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">
            {stats?.pendingLeaves || 0}
          </p>
          <button
            onClick={() => onOpenTab('reviews')}
            className="text-[11px] text-purple-600 hover:underline font-bold mt-1 block"
          >
            Review applications →
          </button>
        </div>
      </div>

      {/* Main 2-Column Admin Grid: Desk Attendance Live + Daily Employee Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Today's Active Attendance Roster */}
        <div className="lg:col-span-7 bg-white rounded-[32px] p-5 sm:p-6 border border-[#ECEAF5] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900 tracking-tight">Today&apos;s Attendance Roster</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {presentEmployees.length} Present
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Biometric Dahua punches, GPS field check-ins, and desk entries
              </p>
            </div>

            <button
              onClick={() => onOpenTab('hiring')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Full Desk Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {presentEmployees.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No employee punches recorded yet today. Click &quot;Desk Register&quot; to mark manually or &quot;Sync Biometric Terminal&quot;.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
              {presentEmployees.map((record, i) => {
                const u = record.user;
                if (!u) return null;
                const isField = u.workMode === 'FIELD';
                const isLate = record.status === 'LATE';

                return (
                  <div key={i} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.name?.charAt(0) || 'E'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 truncate">{u.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{u.employeeId}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {isField ? `📍 Site: ${record.location?.siteName || 'Field'}` : '🏢 Office Terminal'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {formatTime(record.clockIn)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isLate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
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
        <div className="lg:col-span-5 bg-white rounded-[32px] p-5 sm:p-6 border border-[#ECEAF5] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900 tracking-tight">Staff Task Submissions</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  {recentTasks.length} Today
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Work progress submitted by staff today
              </p>
            </div>

            <button
              onClick={() => onOpenTab('apps')}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No staff work tasks submitted yet today.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-xs text-slate-900 truncate">
                      {task.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{task.description}</p>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium text-slate-700">{task.user?.name}</span>
                    {task.hoursSpent ? (
                      <span className="font-mono font-bold text-slate-500">{task.hoursSpent} hrs</span>
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
