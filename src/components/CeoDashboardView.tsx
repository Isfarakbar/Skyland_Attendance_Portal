'use client';

import React, { useState } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Building,
  ExternalLink,
  Calendar,
  Sparkles,
  Search,
  CheckSquare,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  UserX,
  Palmtree,
  ArrowUpRight,
} from 'lucide-react';

interface CeoDashboardViewProps {
  stats: any;
  lateEmployees: any[];
  presentEmployees: any[];
  absentEmployees: any[];
  recentTasks: any[];
  onOpenTab: (tab: string) => void;
  onRefresh: () => void;
}

export default function CeoDashboardView({
  stats,
  lateEmployees,
  presentEmployees,
  absentEmployees,
  recentTasks,
  onOpenTab,
  onRefresh,
}: CeoDashboardViewProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'OFFICE' | 'FIELD'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPresent = presentEmployees.filter((record) => {
    const user = record.user;
    if (!user) return false;
    const matchesMode =
      filterMode === 'ALL' ||
      (filterMode === 'OFFICE' && user.workMode !== 'FIELD') ||
      (filterMode === 'FIELD' && user.workMode === 'FIELD');
    const matchesSearch =
      searchTerm.trim() === '' ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.location?.siteName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMode && matchesSearch;
  });

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Executive Welcome & Live Overview */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Executive Oversight Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            CEO Workforce Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time monitoring of on-site solar teams, office staff, and daily punctuality
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Live Sync</span>
          </button>
          <button
            onClick={() => onOpenTab('people')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl shadow-xs shadow-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Directory</span>
          </button>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Workforce */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Staff</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {stats?.totalEmployees || 0}
          </p>
          <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            <span>{stats?.officeTotal || 0} Office</span>
            <span>•</span>
            <span>{stats?.siteTotal || 0} Site</span>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200/80 shadow-xs bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Present Now</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
            {stats?.presentToday || 0}
          </p>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>{stats?.officePresent || 0} Office</span>
            <span>•</span>
            <span>{stats?.sitePresent || 0} On Site</span>
          </div>
        </div>

        {/* Late Today - PRIORITY ALERT */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition-all ${
          (stats?.lateToday || 0) > 0
            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/40'
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              (stats?.lateToday || 0) > 0 ? 'text-amber-800 font-black' : 'text-slate-400'
            }`}>
              Late Arrivals
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              (stats?.lateToday || 0) > 0 ? 'bg-amber-200 text-amber-900 animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black mt-2 ${
            (stats?.lateToday || 0) > 0 ? 'text-amber-900' : 'text-slate-900'
          }`}>
            {stats?.lateToday || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {(stats?.lateToday || 0) > 0 ? 'Requires attention' : 'Zero late arrivals'}
          </p>
        </div>

        {/* Absent Today */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unreported / Off</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
            {stats?.absentToday || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">No punch recorded yet</p>
        </div>

        {/* Approved Leaves */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">On Leave Today</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">
            {stats?.onLeaveToday || 0}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Official leaves</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRIORITY 1: WHO IS LATE TODAY (CEO HIGHEST FOCUS) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[32px] p-5 sm:p-7 border border-amber-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Late Arrivals Flagged Today
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                  {lateEmployees.length} Flagged
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff members who punched in after shift start time
              </p>
            </div>
          </div>
        </div>

        {lateEmployees.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">All employees arrived on time today!</p>
            <p className="text-xs text-slate-400 mt-0.5">No late arrival penalties or flags recorded for today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-1">
            {lateEmployees.map((record, idx) => {
              const u = record.user;
              if (!u) return null;
              const isField = u.workMode === 'FIELD';
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-300">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.name?.charAt(0) || 'E'}</span>
                        )}
                      </div>
                      <div className="truncate">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">{u.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{u.designation || 'Staff'}</p>
                        <span className="text-[10px] font-mono text-slate-400">{u.employeeId}</span>
                      </div>
                    </div>

                    <span className="px-2 py-1 rounded-lg text-[11px] font-black bg-rose-100 text-rose-800 whitespace-nowrap">
                      +{record.minutesLate || 15}m Late
                    </span>
                  </div>

                  <div className="pt-2 border-t border-amber-100/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Punched In At</span>
                      <span className="font-extrabold text-slate-800 font-mono">
                        {formatTime(record.clockIn)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Work Mode</span>
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {isField ? (
                          <>
                            <MapPin className="w-3 h-3 text-amber-600" /> Site Field
                          </>
                        ) : (
                          <>
                            <Building className="w-3 h-3 text-blue-600" /> Office
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Punch Source & Location */}
                  <div className="pt-2 border-t border-amber-100/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Via{' '}
                      <strong className="text-slate-800">
                        {record.source === 'BIOMETRIC'
                          ? 'Dahua Fingerprint'
                          : record.source === 'FIELD'
                          ? 'GPS Mobile Check-In'
                          : 'Desk Register'}
                      </strong>
                    </span>

                    {record.location?.latitude && (
                      <a
                        href={`https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>View Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PRIORITY 2: WHO IS PRESENT RIGHT NOW (OFFICE VS SITE WORKFORCE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[32px] p-5 sm:p-7 border border-[#ECEAF5] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Currently Present Workforce
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                {presentEmployees.length} Active Now
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live breakdown of office attendees and field solar site engineers
            </p>
          </div>

          {/* Mode Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-full p-1 text-xs font-bold text-slate-600">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  filterMode === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All ({presentEmployees.length})
              </button>
              <button
                onClick={() => setFilterMode('OFFICE')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  filterMode === 'OFFICE' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Office ({stats?.officePresent || 0})
              </button>
              <button
                onClick={() => setFilterMode('FIELD')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  filterMode === 'FIELD' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Site ({stats?.sitePresent || 0})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 w-40 sm:w-48"
              />
            </div>
          </div>
        </div>

        {filteredPresent.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No employees match the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredPresent.map((record, i) => {
              const u = record.user;
              if (!u) return null;
              const isField = u.workMode === 'FIELD';
              const isLate = record.status === 'LATE';

              return (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.name?.charAt(0) || 'E'}</span>
                        )}
                      </div>
                      <div className="truncate">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">{u.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{u.department || 'Skyland'}</p>
                        <span className="text-[10px] font-mono text-slate-400">{u.employeeId}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isLate
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isLate ? 'Late' : 'On Time'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Arrival</span>
                      <span className="font-bold text-slate-800 font-mono">{formatTime(record.clockIn)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Mode</span>
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        {isField ? (
                          <>
                            <MapPin className="w-3 h-3 text-amber-600" /> Site Field
                          </>
                        ) : (
                          <>
                            <Building className="w-3 h-3 text-slate-500" /> Office Desk
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Site Location or Machine Indicator */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    {isField ? (
                      <span className="truncate max-w-[170px]" title={record.location?.siteName}>
                        📍 {record.location?.siteName || 'Solar Field Site'}
                      </span>
                    ) : (
                      <span>🏢 Dahua Biometric Verified</span>
                    )}

                    {record.location?.latitude && (
                      <a
                        href={`https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 font-bold hover:underline flex items-center gap-1 shrink-0"
                      >
                        <span>GPS Pin</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: RECENT WORK TASK SUBMISSIONS (CEO FEED) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-[32px] p-5 sm:p-7 border border-[#ECEAF5] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Today&apos;s Submitted Employee Work Tasks
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
                {recentTasks.length} Reports Today
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review daily progress, completed deliverables, and field milestones
            </p>
          </div>

          <button
            onClick={() => onOpenTab('apps')}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <span>View All Tasks</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No employee work reports submitted yet today.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentTasks.map((task) => (
              <div
                key={task._id}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    {task.user?.avatarUrl ? (
                      <img
                        src={task.user.avatarUrl}
                        alt={task.user.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span>{task.user?.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{task.title}</span>
                      <span className="text-[11px] font-bold text-slate-400">• {task.user?.name}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{task.description}</p>
                    {task.blockers && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                        ⚠️ Blocker: {task.blockers}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : task.status === 'BLOCKED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {task.status}
                  </span>
                  {task.hoursSpent ? (
                    <span className="text-xs font-mono text-slate-500 font-bold">
                      {task.hoursSpent} hrs
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
