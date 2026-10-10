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
      } else if (data.user.role === 'manager') {
        setActiveTab('directory'); // CEO lands directly on Staff & 360 Dossiers
        fetchAdminStats();
      } else if (data.user.role === 'admin') {
        setActiveTab('register'); // Admin receptionist lands directly on Desk Register
        fetchAdminStats();
      } else {
        setActiveTab('attendance');
      }

      // Fetch today's desk-marked state & employee monthly stats (only for regular employees)
      if (!['developer', 'manager'].includes(data.user.role)) {
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

  const isElevatedUser = user && ['developer', 'admin', 'manager'].includes(user.role);
  const isDeveloper = user?.role === 'developer';
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const getHeaderTitle = () => {
    if (isDeveloper) return 'Master Operations Console';
    if (isManager) return 'CEO Executive Suite';
    if (isAdmin) return 'Desk Reception & Administrative Portal';
    return `Welcome, ${user?.name}`;
  };

  const getHeaderSubtitle = () => {
    if (isDeveloper) return 'Direct database control, desk register oversight, and payroll configuration';
    if (isManager) return 'Executive workforce oversight, employee 360 dossiers, daily progress tasks, and company payroll';
    if (isAdmin) return 'Daily desk attendance register, monthly leave limits, and salary calculations';
    return 'View your daily desk attendance, monthly calendar, and salary deduction sheet';
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
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

        {/* Simplistic Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
            {isElevatedUser ? (
              <>
                {/* Developer Diagnostic Console tab */}
                {isDeveloper && (
                  <button
                    onClick={() => setActiveTab('developer')}
                    className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'developer'
                        ? 'border-violet-600 text-violet-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Terminal className="w-4 h-4 text-violet-600" />
                    <span>Developer Console</span>
                  </button>
                )}

                {/* For CEO / Manager: Staff & 360 Dossiers is priority #1 */}
                {isManager && (
                  <button
                    onClick={() => setActiveTab('directory')}
                    className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'directory'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Staff &amp; 360 Profiles</span>
                  </button>
                )}

                {/* Salary Sheet & Payroll */}
                <button
                  onClick={() => setActiveTab('salary')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'salary'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Salary Sheet &amp; Payroll</span>
                </button>

                {/* Work Tasks / Daily Progress */}
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Daily Work Tasks</span>
                </button>

                {/* Monthly Visual Calendar */}
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Attendance Calendar</span>
                </button>

                {/* Staff & Salaries for Developer and Admin */}
                {!isManager && (
                  <button
                    onClick={() => setActiveTab('directory')}
                    className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'directory'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Staff &amp; Salaries</span>
                  </button>
                )}

                {/* Leave Approvals */}
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

                {/* Desk Register (Audit view for CEO, Daily mark for Admin/Dev) */}
                <button
                  onClick={() => setActiveTab('register')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'register'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>{isManager ? 'Desk Register Audit' : 'Desk Register'}</span>
                </button>

                {/* Rules & Settings for Developer and Admin */}
                {(isDeveloper || isAdmin) && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'settings'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Company Rules</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>My Attendance & Calendar</span>
                </button>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Submit Daily Tasks</span>
                </button>

                <button
                  onClick={() => setActiveTab('salary')}
                  className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'salary'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>My Salary & Pay Sheet</span>
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
    </div>
  );
}
