'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CeoDashboardView from '@/components/CeoDashboardView';
import AdminDashboardView from '@/components/AdminDashboardView';
import EmployeeDashboardView from '@/components/EmployeeDashboardView';
import CompleteProfileModal from '@/components/CompleteProfileModal';
import ClockWidget from '@/components/ClockWidget';
import FieldCheckInWidget from '@/components/FieldCheckInWidget';
import DeskRegister from '@/components/DeskRegister';
import SalarySheet from '@/components/SalarySheet';
import AttendanceCalendar from '@/components/AttendanceCalendar';
import EmployeeDirectory from '@/components/EmployeeDirectory';
import LeaveApprovals from '@/components/LeaveApprovals';
import LeaveSection from '@/components/LeaveSection';
import CompanySettingsTab from '@/components/CompanySettingsTab';
import DeveloperConsole from '@/components/DeveloperConsole';
import DailyTaskSection from '@/components/DailyTaskSection';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: default to 'dashboard'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Employee Punch & Today data
  const [todayData, setTodayData] = useState<any>(null);
  const [employeeStats, setEmployeeStats] = useState<any>(null);

  // Executive & Admin stats + arrays
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [lateEmployees, setLateEmployees] = useState<any[]>([]);
  const [presentEmployees, setPresentEmployees] = useState<any[]>([]);
  const [absentEmployees, setAbsentEmployees] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  // Complete Profile Modal State
  const [isCompleteProfileOpen, setIsCompleteProfileOpen] = useState(false);

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

      // Fetch stats for executive/admin view
      fetchDashboardStats();

      // Fetch today's desk-marked state & employee monthly stats
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
        const deductions = excessOffs * dailyRate + excessHalfLeaves * halfDayRate;
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

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.stats);
        setLateEmployees(data.lateEmployees || []);
        setPresentEmployees(data.presentEmployees || []);
        setAbsentEmployees(data.absentEmployees || []);
        setRecentTasks(data.recentTasks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshAll = () => {
    fetchDashboardStats();
    fetchTodayState();
    if (user) fetchEmployeeHistory(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FD] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-wider text-emerald-600">
            Loading Skyland Energy Portal...
          </p>
        </div>
      </div>
    );
  }

  const isDeveloper = user?.role === 'developer';
  const isAdmin = user?.role === 'admin' || isDeveloper;
  const isCeo = user?.role === 'ceo' || user?.designation?.toLowerCase().includes('ceo');
  const isElevatedUser = isAdmin || isCeo;

  return (
    <div className="min-h-screen bg-[#FAF9FD] text-[#1E1B38] pb-16 selection:bg-emerald-600/10 selection:text-emerald-700">
      {/* Top Navigation Bar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenEditProfile={() => setIsCompleteProfileOpen(true)}
        pendingApprovalsCount={dashboardStats?.pendingLeaves || 0}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* ========================================================================= */}
        {/* 1. DASHBOARD TAB: ROLE-TAILORED VIEWS (CEO / ADMIN / EMPLOYEE) */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <>
            {isCeo ? (
              /* CEO EXECUTIVE DASHBOARD: Punctuality, Late Flagging, Live Site vs Office */
              <CeoDashboardView
                stats={dashboardStats}
                lateEmployees={lateEmployees}
                presentEmployees={presentEmployees}
                absentEmployees={absentEmployees}
                recentTasks={recentTasks}
                onOpenTab={(tab) => setActiveTab(tab)}
                onRefresh={handleRefreshAll}
              />
            ) : isAdmin ? (
              /* ADMIN MASTER DASHBOARD: Master Controls, Device Sync, Quick Attendance, Staff Monitor */
              <AdminDashboardView
                stats={dashboardStats}
                lateEmployees={lateEmployees}
                presentEmployees={presentEmployees}
                absentEmployees={absentEmployees}
                recentTasks={recentTasks}
                onOpenTab={(tab) => setActiveTab(tab)}
                onRefresh={handleRefreshAll}
              />
            ) : (
              /* STAFF EMPLOYEE DASHBOARD: Office Biometric or Site GPS + Daily Task Submission + Profile */
              <EmployeeDashboardView
                user={user}
                todayData={todayData}
                employeeStats={employeeStats}
                onOpenCompleteProfile={() => setIsCompleteProfileOpen(true)}
                onOpenTab={(tab) => setActiveTab(tab)}
                onRefresh={handleRefreshAll}
              />
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. STAFF DIRECTORY TAB (PEOPLE) */}
        {/* ========================================================================= */}
        {activeTab === 'people' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Staff &amp; Workforce Directory</h2>
                <p className="text-xs text-slate-500 mt-1">Manage team members, roles, work modes, and biometric IDs</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
              >
                ← Back to Dashboard
              </button>
            </div>
            {isElevatedUser ? (
              <EmployeeDirectory />
            ) : (
              <div className="bg-white rounded-[32px] p-8 text-center border border-[#ECEAF5] shadow-xs">
                <p className="text-sm font-semibold text-slate-600">Company directory is managed by HR &amp; Administration.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ATTENDANCE REGISTER TAB (HIRING / ATTENDANCE) */}
        {/* ========================================================================= */}
        {activeTab === 'hiring' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isElevatedUser ? 'Desk Attendance Register' : 'My Daily Check-In & Attendance'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isElevatedUser
                    ? 'Daily desk sign-in log, biometric verification, and shift records'
                    : 'View check-in status, punch history, and monthly calendar'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
              >
                ← Back to Dashboard
              </button>
            </div>

            {isElevatedUser ? (
              <DeskRegister />
            ) : (
              <div className="space-y-6">
                {user?.workMode === 'FIELD' ? (
                  <FieldCheckInWidget
                    todayData={todayData}
                    onRefresh={handleRefreshAll}
                  />
                ) : (
                  <ClockWidget
                    todayData={todayData}
                    onRefresh={handleRefreshAll}
                  />
                )}
                <AttendanceCalendar currentUserId={user?._id} userRole={user?.role} />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. WORK TASKS TAB (APPS / TASKS) */}
        {/* ========================================================================= */}
        {activeTab === 'apps' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Work Tasks &amp; Milestones</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isElevatedUser
                    ? 'Review all submitted daily tasks, achievements, and blockers from workforce'
                    : 'Submit your daily achievements, report blockers, and log project work'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
              >
                ← Back to Dashboard
              </button>
            </div>
            {/* If management, don't pass userId so all tasks from employees can be reviewed */}
            <DailyTaskSection userId={!isElevatedUser ? user?._id : undefined} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. COMPENSATION & SALARY SHEET TAB */}
        {/* ========================================================================= */}
        {activeTab === 'salary' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compensation &amp; Salary Sheet</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isElevatedUser
                    ? 'Staff payroll ledger, auto-deduction calculations, and payslip export'
                    : 'Personal monthly wage summary and payslip breakdown'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
              >
                ← Back to Dashboard
              </button>
            </div>
            <SalarySheet
              isEmployeeOnly={!isElevatedUser}
              userId={!isElevatedUser ? user?._id : undefined}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. ATTENDANCE & SCHEDULE CALENDAR TAB */}
        {/* ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Attendance &amp; Schedule Calendar</h2>
                <p className="text-xs text-slate-500 mt-1">Visual monthly view of attendance days, offs, and holidays</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
              >
                ← Back to Dashboard
              </button>
            </div>
            <AttendanceCalendar
              currentUserId={user?._id}
              userRole={user?.role}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. LEAVE MANAGEMENT TAB (REVIEWS) */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isElevatedUser ? 'Leave Approvals & Requests' : 'Apply for Leave'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isElevatedUser
                    ? 'Review and approve/reject staff leave applications'
                    : 'Submit leave applications and check approval status'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
              >
                ← Back to Dashboard
              </button>
            </div>
            {isElevatedUser ? (
              <LeaveApprovals />
            ) : (
              <LeaveSection userId={user?._id} />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. COMPANY SETTINGS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portal Configuration &amp; Rules</h2>
                <p className="text-xs text-slate-500 mt-1">Configure company policies, shift timings, and deduction rules</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
              >
                ← Back to Dashboard
              </button>
            </div>
            {isElevatedUser ? (
              <CompanySettingsTab />
            ) : (
              <div className="bg-white rounded-[32px] p-8 text-center border border-[#ECEAF5] shadow-xs">
                <p className="text-sm font-semibold text-slate-600">Company settings are reserved for administrators.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 9. DEVELOPER CONSOLE TAB */}
        {/* ========================================================================= */}
        {activeTab === 'developer' && isDeveloper && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <DeveloperConsole />
          </div>
        )}
      </main>

      {/* Complete Profile Modal (Full dossier with photo upload, bio, bank, phone, emergency) */}
      {isCompleteProfileOpen && user && (
        <CompleteProfileModal
          user={user}
          onClose={() => setIsCompleteProfileOpen(false)}
          onProfileUpdated={(updated) => {
            setUser((prev: any) => ({ ...prev, ...updated }));
          }}
        />
      )}
    </div>
  );
}
