'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ClockWidget from '@/components/ClockWidget';
import StatsCards from '@/components/StatsCards';
import EmployeeCalendar from '@/components/EmployeeCalendar';
import LeaveSection from '@/components/LeaveSection';
import AdminRoster from '@/components/AdminRoster';
import EmployeeDirectory from '@/components/EmployeeDirectory';
import LeaveApprovals from '@/components/LeaveApprovals';
import ExportReports from '@/components/ExportReports';
import { Clock, Calendar, Users, Palmtree, FileSpreadsheet, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'punch' | 'leaves' | 'roster' | 'directory' | 'approvals' | 'export'>('punch');

  // Employee Punch & Today data
  const [todayData, setTodayData] = useState<any>(null);
  const [employeeStats, setEmployeeStats] = useState<any>(null);

  // Admin Dashboard stats
  const [adminStats, setAdminStats] = useState<any>(null);

  useEffect(() => {
    fetchSessionAndData();
  }, []);

  const fetchSessionAndData = async () => {
    try {
      // 1. Get User
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);

      // Default active tab based on role
      if (['admin', 'hr'].includes(data.user.role)) {
        setActiveTab('roster');
        fetchAdminStats();
      } else {
        setActiveTab('punch');
      }

      // Fetch employee punch state
      fetchTodayState();
      fetchEmployeeHistory(data.user);
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayState = async () => {
    try {
      const res = await fetch('/api/attendance/today');
      const data = await res.json();
      if (data.success) {
        setTodayData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployeeHistory = async (currentUser: any) => {
    try {
      const currentMonth = (new Date().getMonth() + 1).toString();
      const currentYear = new Date().getFullYear().toString();
      const res = await fetch(`/api/attendance/history?month=${currentMonth}&year=${currentYear}`);
      const data = await res.json();
      if (data.success) {
        const records = data.records || [];
        const presentCount = records.length;
        const lateCount = records.filter((r: any) => r.status === 'LATE').length;
        const totalMinutes = records.reduce((sum: number, r: any) => sum + (r.totalWorkMinutes || 0), 0);

        setEmployeeStats({
          presentDays: presentCount,
          lateDays: lateCount,
          totalHours: totalMinutes / 60,
          leaveBalance: currentUser?.leaveBalance || { sick: 8, casual: 10, annual: 14 },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setAdminStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Demo user switch handler
  const handleUserSwitch = async (email: string) => {
    setLoading(true);
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      fetchSessionAndData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading Skyland Portal...</p>
        </div>
      </div>
    );
  }

  const isAdminOrHr = user && ['admin', 'hr'].includes(user.role);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Navbar */}
      <Navbar user={user} onUserSwitch={handleUserSwitch} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isAdminOrHr ? 'Management Portal' : `Welcome, ${user?.name}`}
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                {user?.department}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isAdminOrHr
                ? 'Team oversight, real-time presence tracking, and leave approvals'
                : 'Track daily attendance, clock shifts, and manage leave balances'}
            </p>
          </div>

          {/* Quick Info Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Shift: 09:00 AM – 06:00 PM</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Grace: 15 mins</span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <StatsCards
          isAdminOrHr={isAdminOrHr}
          adminStats={adminStats}
          employeeStats={employeeStats}
        />

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
            {isAdminOrHr ? (
              <>
                <button
                  onClick={() => setActiveTab('roster')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'roster'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Daily Roster ("Who's in")</span>
                </button>

                <button
                  onClick={() => setActiveTab('directory')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'directory'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Employee Directory</span>
                </button>

                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'approvals'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Palmtree className="w-4 h-4" />
                  <span>Leave Approvals</span>
                  {adminStats?.pendingLeaves > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full text-[10px]">
                      {adminStats.pendingLeaves}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('export')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'export'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Payroll Excel Export</span>
                </button>

                <button
                  onClick={() => setActiveTab('punch')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'punch'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Personal Punch</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('punch')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'punch'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Punch & Attendance</span>
                </button>

                <button
                  onClick={() => setActiveTab('leaves')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'leaves'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Palmtree className="w-4 h-4" />
                  <span>Time Off & Leave Requests</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Tab Content Panes */}
        <div className="space-y-8">
          {/* Punch Tab */}
          {activeTab === 'punch' && (
            <div className="space-y-8">
              <ClockWidget
                todayData={todayData}
                onRefresh={() => {
                  fetchTodayState();
                  fetchEmployeeHistory(user);
                  if (isAdminOrHr) fetchAdminStats();
                }}
              />
              <EmployeeCalendar userId={user?._id} />
            </div>
          )}

          {/* Leaves Tab (for Employee) */}
          {activeTab === 'leaves' && (
            <LeaveSection leaveBalance={user?.leaveBalance} />
          )}

          {/* Daily Roster Tab (Admin/HR) */}
          {activeTab === 'roster' && <AdminRoster />}

          {/* Employee Directory Tab (Admin/HR) */}
          {activeTab === 'directory' && <EmployeeDirectory />}

          {/* Leave Approvals Tab (Admin/HR) */}
          {activeTab === 'approvals' && <LeaveApprovals />}

          {/* Export Reports Tab (Admin/HR) */}
          {activeTab === 'export' && <ExportReports />}
        </div>
      </main>
    </div>
  );
}
