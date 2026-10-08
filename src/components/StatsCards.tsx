'use client';

import React from 'react';
import { Users, UserCheck, Clock, CalendarDays, AlertTriangle, Palmtree } from 'lucide-react';

interface StatsCardsProps {
  isAdminOrHr: boolean;
  adminStats?: {
    totalEmployees: number;
    presentToday: number;
    lateToday: number;
    onLeaveToday: number;
    absentToday: number;
    pendingLeaves: number;
  };
  employeeStats?: {
    presentDays: number;
    lateDays: number;
    totalHours: number;
    leaveBalance: { sick: number; casual: number; annual: number };
  };
}

export default function StatsCards({ isAdminOrHr, adminStats, employeeStats }: StatsCardsProps) {
  if (isAdminOrHr && adminStats) {
    const attendanceRate =
      adminStats.totalEmployees > 0
        ? Math.round((adminStats.presentToday / adminStats.totalEmployees) * 100)
        : 0;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Employees */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Staff</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{adminStats.totalEmployees}</span>
            <span className="text-xs text-slate-500 font-medium">Active members</span>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Present Today</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{adminStats.presentToday}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              {attendanceRate}% Turnout
            </span>
          </div>
        </div>

        {/* Card 3: Late Arrivals */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Late Arrivals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{adminStats.lateToday}</span>
            <span className="text-xs text-slate-500 font-medium">After grace period</span>
          </div>
        </div>

        {/* Card 4: On Leave / Pending */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">On Leave Today</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palmtree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">{adminStats.onLeaveToday}</span>
            {adminStats.pendingLeaves > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                {adminStats.pendingLeaves} Pending
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Employee View
  if (employeeStats) {
    const totalRemaining =
      (employeeStats.leaveBalance?.sick || 0) +
      (employeeStats.leaveBalance?.casual || 0) +
      (employeeStats.leaveBalance?.annual || 0);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Days */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Present (This Month)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{employeeStats.presentDays}</span>
            <span className="text-xs text-slate-500 font-medium">Days recorded</span>
          </div>
        </div>

        {/* Hours Logged */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Work Hours</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{employeeStats.totalHours.toFixed(1)}</span>
            <span className="text-xs text-slate-500 font-medium">Hours logged</span>
          </div>
        </div>

        {/* Late Days */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Late Arrivals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{employeeStats.lateDays}</span>
            <span className="text-xs text-slate-500 font-medium">Needs punctuality</span>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Leave Balance</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palmtree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">{totalRemaining} Days</span>
            <div className="text-[11px] text-slate-500 flex gap-1">
              <span>S:{employeeStats.leaveBalance?.sick}</span>
              <span>C:{employeeStats.leaveBalance?.casual}</span>
              <span>A:{employeeStats.leaveBalance?.annual}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
