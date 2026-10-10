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
            <span className="text-xs text-slate-500 font-medium">Recorded by desk</span>
          </div>
        </div>

        {/* Card 4: On Leave / Off Today */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Off / Leave Today</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palmtree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">{adminStats.onLeaveToday || adminStats.absentToday || 0}</span>
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
    const totalOffs = employeeStats.totalOffs || 0;
    const totalHalfLeaves = employeeStats.totalHalfLeaves || 0;
    const excessOffs = Math.max(0, totalOffs - 1);
    const excessHalfLeaves = Math.max(0, totalHalfLeaves - 1);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Est. Net Salary */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Est. Net Salary</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              PKR {(employeeStats.netSalary || employeeStats.baseSalary || 30000).toLocaleString()}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Base: PKR {(employeeStats.baseSalary || 30000).toLocaleString()}
          </div>
        </div>

        {/* Days Present */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Days Present</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{employeeStats.presentDays}</span>
            <span className="text-xs text-slate-500 font-medium">Days recorded</span>
          </div>
          {employeeStats.lateDays > 0 && (
            <div className="text-[11px] text-amber-600 mt-0.5 font-medium">
              ({employeeStats.lateDays} late entries)
            </div>
          )}
        </div>

        {/* Offs Taken */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Offs (This Month)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Palmtree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{totalOffs}</span>
            <span className="text-xs text-slate-500 font-medium">/ 1 Free</span>
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5 font-semibold">
            {excessOffs > 0 ? `${excessOffs} excess (deducted)` : 'Within free quota'}
          </div>
        </div>

        {/* Half Leaves */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Half Leaves</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{totalHalfLeaves}</span>
            <span className="text-xs text-slate-500 font-medium">/ 1 Free</span>
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5 font-semibold">
            {excessHalfLeaves > 0 ? `${excessHalfLeaves} excess (deducted)` : 'Within free quota'}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
