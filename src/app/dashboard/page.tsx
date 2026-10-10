'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ClockWidget from '@/components/ClockWidget';
import FieldCheckInWidget from '@/components/FieldCheckInWidget';
import StatsCards from '@/components/StatsCards';
import DeskRegister from '@/components/DeskRegister';
import SalarySheet from '@/components/SalarySheet';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import EmployeeDirectory from '@/components/EmployeeDirectory';
import LeaveApprovals from '@/components/LeaveApprovals';
import LeaveSection from '@/components/LeaveSection';
import CompanySettingsTab from '@/components/CompanySettingsTab';
import DeveloperConsole from '@/components/DeveloperConsole';
import DailyTaskSection from '@/components/DailyTaskSection';
import MobileBottomBar from '@/components/MobileBottomBar';
import { Calendar, Users, Palmtree, FileSpreadsheet, Sliders, Terminal, ClipboardList, DollarSign, CheckSquare } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('register');

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
      if (data.user.role === 'developer') {
        setActiveTab('developer');
        fetchAdminStats();
      } else if (data.user.role === 'admin') {
        setActiveTab('register'); // Admin receptionist lands directly on Desk Register
        fetchAdminStats();
      } else {
        setActiveTab('attendance');
      }

      // Fetch today's desk-marked state & employee monthly stats (only for regular employees)
      if (data.user.role === 'employee') {
        fetchTodayState();
        fetchEmployeeHistory(data.user);
      }
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
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/attendance/history?month=${monthStr}`);
      const data = await res.json();
      if (data.success) {
        const records = data.records || [];
        let presentCount = 0;
        let lateCount = 0;
        let totalOffs = 0;
        let totalHalfLeaves = 0;

        for (const r of records) {
          if (r.status === 'PRESENT') {
            presentCount++;
          } else if (r.status === 'LATE') {
            lateCount++;
            presentCount++;
          } else if (r.status === 'HALF_LEAVE' || r.status === 'HALF_DAY') {
            totalHalfLeaves++;
          } else if (r.status === 'OFF' || r.status === 'ABSENT' || r.status === 'ON_LEAVE') {
            totalOffs++;
          }
        }

        const baseSalary = currentUser?.baseSalary || 30000;
        const dailyRate = Math.round(baseSalary / 30);
        const halfDayRate = Math.round(dailyRate / 2);
        const excessOffs = Math.max(0, totalOffs - 1);
        const excessHalfLeaves = Math.max(0, totalHalfLeaves - 1);
        const deductions = (excessOffs * dailyRate) + (excessHalfLeaves * halfDayRate);
        const netSalary = Math.max(0, baseSalary - deductions);

        setEmployeeStats({
          presentDays: presentCount,
          lateDays: lateCount,
          totalOffs,
          totalHalfLeaves,
          baseSalary,
          netSalary,
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

  const isElevatedUser = user && ['developer', 'admin'].includes(user.role);
  const isDeveloper = user?.role === 'developer';
  const isAdmin = user?.role === 'admin';

  const getHeaderTitle = () => {
    if (isDeveloper) return 'Master Operations Console';
    if (isAdmin) return 'Operations & Administrative Management';
    return `Welcome, ${user?.name}`;
  };

  const getHeaderSubtitle = () => {
    if (isDeveloper) return 'Master root authority: portal designer, database record purge, and user roles';
    if (isAdmin) return 'Desk attendance register, salary configuration, and leave approvals';
    return 'View your daily desk attendance, monthly calendar, and salary deduction sheet';
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 md:pb-16">
      {/* Top Navbar */}
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {getHeaderTitle()}
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                {user?.department}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {getHeaderSubtitle()}
            </p>
          </div>

          {/* Quick Info Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Policy: 1 Free Off & 1 Free Half Leave / mo</span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <StatsCards
          isAdminOrHr={isElevatedUser}
          adminStats={adminStats}
          employeeStats={employeeStats}
        />

        {/* Responsive Touch-Friendly Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <nav className="flex space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
            {isElevatedUser ? (
              <>
                {/* Developer Diagnostic Console tab */}
                {isDeveloper && (
                  <button
                    onClick={() => setActiveTab('developer')}
                    className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                      activeTab === 'developer'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Master Control</span>
                  </button>
                )}

                {/* Desk Register (Mark daily for Admin / Dev) */}
                <button
                  onClick={() => setActiveTab('register')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'register'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Desk Register</span>
                </button>

                {/* Staff & Salaries */}
                <button
                  onClick={() => setActiveTab('directory')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'directory'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Staff &amp; Salaries</span>
                </button>

                {/* Salary Sheet & Payroll */}
                <button
                  onClick={() => setActiveTab('salary')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'salary'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Salary Sheet</span>
                </button>

                {/* Work Tasks / Daily Progress */}
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'tasks'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Work Tasks</span>
                </button>

                {/* Monthly Visual Calendar */}
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'calendar'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendar</span>
                </button>

                {/* Leave Approvals */}
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'approvals'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Palmtree className="w-4 h-4" />
                  <span>Leaves</span>
                  {adminStats?.pendingLeaves > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold">
                      {adminStats.pendingLeaves}
                    </span>
                  )}
                </button>

                {/* Rules & Settings */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'settings'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Rules</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'attendance'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{user?.workMode === 'FIELD' ? 'Site Check-In' : 'Attendance & Status'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'tasks'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Daily Tasks</span>
                </button>

                <button
                  onClick={() => setActiveTab('salary')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'salary'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>My Salary</span>
                </button>

                <button
                  onClick={() => setActiveTab('leaves')}
                  className={`py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    activeTab === 'leaves'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Palmtree className="w-4 h-4" />
                  <span>Leave Requests</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Tab Content Panes */}
        <div className="space-y-8">
          {/* Desk Register Tab (Admin / Manager) */}
          {activeTab === 'register' && isElevatedUser && (
            <DeskRegister />
          )}

          {/* Salary Sheet Tab (Company-wide for management, Personal for employee) */}
          {activeTab === 'salary' && (
            <SalarySheet
              isEmployeeOnly={!isElevatedUser}
              userId={!isElevatedUser ? user?._id : undefined}
            />
          )}

          {/* Calendar View Tab (Management View) */}
          {activeTab === 'calendar' && isElevatedUser && (
            <AttendanceCalendar
              currentUserId={user?._id}
              userRole={user?.role}
            />
          )}

          {/* Employee Attendance & Calendar Tab */}
          {activeTab === 'attendance' && !isElevatedUser && (
            <div className="space-y-6">
              {/* If employee is assigned to Field duty, render GPS Field Check-In; if Office staff, show Desk status */}
              {user?.workMode === 'FIELD' ? (
                <FieldCheckInWidget
                  todayData={todayData}
                  onRefresh={() => {
                    fetchTodayState();
                    fetchEmployeeHistory(user);
                  }}
                />
              ) : (
                <ClockWidget
                  todayData={todayData}
                  onRefresh={() => {
                    fetchTodayState();
                    fetchEmployeeHistory(user);
                  }}
                />
              )}

              {/* Visual calendar */}
              <AttendanceCalendar
                currentUserId={user?._id}
                userRole={user?.role}
              />
            </div>
          )}

          {/* Daily Tasks Tab (Both Management overview and Employee submission) */}
          {activeTab === 'tasks' && (
            <DailyTaskSection userId={!isElevatedUser ? user?._id : undefined} />
          )}

          {/* Employee Directory Tab (Admin/HR) */}
          {activeTab === 'directory' && isElevatedUser && (
            <EmployeeDirectory />
          )}

          {/* Leave Approvals Tab (Admin/HR) */}
          {activeTab === 'approvals' && isElevatedUser && (
            <LeaveApprovals />
          )}

          {/* Leaves Tab (for Employee) */}
          {activeTab === 'leaves' && !isElevatedUser && (
            <LeaveSection userId={user?._id} />
          )}

          {/* Company Settings Tab (Admin and Developer) */}
          {activeTab === 'settings' && (isDeveloper || isAdmin) && (
            <CompanySettingsTab />
          )}

          {/* Developer Console Tab (Developer only) */}
          {activeTab === 'developer' && isDeveloper && (
            <DeveloperConsole />
          )}
        </div>
      </main>

      {/* 4-Button Mobile Navigation Bar (Clean Corporate Design) */}
      <MobileBottomBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={user?.role}
        workMode={user?.workMode}
        pendingLeaves={adminStats?.pendingLeaves || 0}
      />
    </div>
  );
}
