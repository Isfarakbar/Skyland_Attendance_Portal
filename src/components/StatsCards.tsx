'use client';

import React from 'react';
import { Users, UserCheck, Clock, Palmtree, DollarSign, CalendarCheck } from 'lucide-react';

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
    totalOffs?: number;
    totalHalfLeaves?: number;
    netSalary?: number;
    baseSalary?: number;
    totalHours?: number;
    leaveBalance?: { sick: number; casual: number; annual: number };
  };
}

export default function StatsCards({ isAdminOrHr, adminStats, employeeStats }: StatsCardsProps) {
  if (isAdminOrHr && adminStats) {
    const attendanceRate =
      adminStats.totalEmployees > 0
        ? Math.round((adminStats.presentToday / adminStats.totalEmployees) * 100)
        : 0;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Employees */}
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Staff</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{adminStats.totalEmployees}</span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Active</span>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Present</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{adminStats.presentToday}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {attendanceRate}%
            </span>
          </div>
        </div>

        {/* Card 3: Late Arrivals */}
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Late</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{adminStats.lateToday}</span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Logged</span>
          </div>
        </div>

        {/* Card 4: On Leave / Off Today */}
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Off / Leave</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Palmtree className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-400">{adminStats.onLeaveToday || adminStats.absentToday || 0}</span>
            {adminStats.pendingLeaves > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 animate-pulse">
                {adminStats.pendingLeaves} req
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Employee View
  if (employeeStats) {
    const totalOffs = employeeStats.totalOffs || 0;
    const totalHalfLeaves = employeeStats.totalHalfLeaves || 0;
    const excessOffs = Math.max(0, totalOffs - 1);
    const excessHalfLeaves = Math.max(0, totalHalfLeaves - 1);

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Est. Net Salary */}
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Est. Salary</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              PKR {(employeeStats.netSalary || employeeStats.baseSalary || 30000).toLocaleString()}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Base: PKR {(employeeStats.baseSalary || 30000).toLocaleString()}
          </div>
        </div>

        {/* Days Present */}
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Present</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{employeeStats.presentDays}</span>
            <span className="text-[11px] text-slate-400 font-medium">Days</span>
          </div>
          {employeeStats.lateDays > 0 && (
            <div className="text-[10px] text-amber-400 mt-1 font-semibold">
              ({employeeStats.lateDays} late entries)
            </div>
          )}
        </div>

        {/* Offs Taken */}
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Offs Taken</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Palmtree className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-400">{totalOffs}</span>
            <span className="text-[11px] text-slate-400 font-medium">/ 1 Free</span>
          </div>
          <div className="text-[10px] text-rose-400 mt-1 font-semibold truncate">
            {excessOffs > 0 ? `${excessOffs} excess fine` : 'Within quota'}
          </div>
        </div>

        {/* Half Leaves */}
        <div className="glass-card rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Half Leaves</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{totalHalfLeaves}</span>
            <span className="text-[11px] text-slate-400 font-medium">/ 1 Free</span>
          </div>
          <div className="text-[10px] text-amber-400 mt-1 font-semibold truncate">
            {excessHalfLeaves > 0 ? `${excessHalfLeaves} excess fine` : 'Within quota'}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
