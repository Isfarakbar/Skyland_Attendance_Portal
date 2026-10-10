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
import BottomNav from '@/components/BottomNav';
import { Calendar, Users, Palmtree, FileSpreadsheet, Sliders, Terminal, ClipboardList, DollarSign, CheckSquare, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen pb-24 text-slate-100">
      {/* Top Navbar */}
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Welcome Glass Banner */}
        <div className="glass-panel-orange rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                {getHeaderTitle()}
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {user?.department}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {getHeaderSubtitle()}
            </p>
          </div>

          {/* Quick Info Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-full text-xs text-orange-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Policy: 1 Free Off &amp; 1 Free Half Leave / mo</span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <StatsCards
          isAdminOrHr={isElevatedUser}
          adminStats={adminStats}
          employeeStats={employeeStats}
        />

        {/* Desktop Tab Navigation (Also synced with floating mobile nav) */}
        <div className="hidden md:block border-b border-white/10">
          <nav className="flex space-x-2 overflow-x-auto pb-px">
            {isElevatedUser ? (
              <>
                {/* Developer Diagnostic Console tab */}
                {isDeveloper && (
                  <button
                    onClick={() => setActiveTab('developer')}
                    className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'developer'
                        ? 'border-orange-500 text-orange-400 font-black'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Terminal className="w-4 h-4 text-orange-400" />
                    <span>Master Control</span>
                  </button>
                )}

                {/* Desk Register (Mark daily for Admin / Dev) */}
                <button
                  onClick={() => setActiveTab('register')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'register'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Desk Register</span>
                </button>

                {/* Staff & Salaries */}
                <button
                  onClick={() => setActiveTab('directory')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'directory'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Staff &amp; Salaries</span>
                </button>

                {/* Salary Sheet & Payroll */}
                <button
                  onClick={() => setActiveTab('salary')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'salary'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Salary Sheet &amp; Payroll</span>
                </button>

                {/* Work Tasks / Daily Progress */}
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Daily Work Tasks</span>
                </button>

                {/* Monthly Visual Calendar */}
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Attendance Calendar</span>
                </button>

                {/* Leave Approvals */}
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'approvals'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Palmtree className="w-4 h-4" />
                  <span>Leave Approvals</span>
                  {adminStats?.pendingLeaves > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-orange-500 text-white rounded-full text-[10px] font-bold">
                      {adminStats.pendingLeaves}
                    </span>
                  )}
                </button>

                {/* Rules & Settings */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'settings'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Company Rules</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{user?.workMode === 'FIELD' ? 'Site Check-In' : 'My Attendance & Status'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Submit Daily Tasks</span>
                </button>

                <button
                  onClick={() => setActiveTab('salary')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'salary'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>My Salary &amp; Pay Sheet</span>
                </button>

                <button
                  onClick={() => setActiveTab('leaves')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'leaves'
                      ? 'border-orange-500 text-orange-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-white'
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

      {/* Floating Glassmorphic Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={user?.role}
        workMode={user?.workMode}
        pendingLeaves={adminStats?.pendingLeaves || 0}
      />
    </div>
  );
}
