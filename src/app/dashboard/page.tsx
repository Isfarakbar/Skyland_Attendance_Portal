'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
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
import BiometricDeviceManager from '@/components/BiometricDeviceManager';

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

  // Live 15-second background sync so physical biometric swipes appear in real-time
  useEffect(() => {
    if (!user) return;
    const isMgmt = ['developer', 'admin', 'ceo', 'manager'].includes(user.role);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchTodayState();
        if (isMgmt) {
          fetchDashboardStats();
        }
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

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

      // Fetch stats only for executive/admin/management view
      if (['developer', 'admin', 'ceo', 'manager'].includes(data.user.role)) {
        fetchDashboardStats();
      }

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
      // Management accounts (admin, developer, ceo) do not have personal payroll or attendance stats
      if (['developer', 'admin', 'ceo'].includes(currentUser?.role)) {
        return;
      }

      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      const [historyRes, payrollRes] = await Promise.all([
        fetch(`/api/attendance/history?month=${monthStr}`),
        fetch(`/api/payroll?month=${monthStr}`),
      ]);

      const historyData = await historyRes.json();
      const payrollData = await payrollRes.json();

      let presentCount = 0;
      let lateCount = 0;
      let totalOffs = 0;
      let totalHalfLeaves = 0;

      if (historyData.success && historyData.records) {
        for (const r of historyData.records) {
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
      }

      let baseSalary = typeof currentUser?.baseSalary === 'number' ? currentUser.baseSalary : 0;
      let netSalary = baseSalary;

      if (payrollData.success && Array.isArray(payrollData.payroll) && payrollData.payroll.length > 0) {
        const p = payrollData.payroll.find((rec: any) => rec.userId === (currentUser?.id || currentUser?._id)) || payrollData.payroll[0];
        if (p) {
          baseSalary = p.baseSalary;
          netSalary = p.netSalary;
          presentCount = p.presentDays;
          lateCount = p.lateDays;
          totalOffs = p.totalOffs;
          totalHalfLeaves = p.totalHalfLeaves;
        }
      }

      setEmployeeStats({
        presentDays: presentCount,
        lateDays: lateCount,
        totalOffs,
        totalHalfLeaves,
        baseSalary,
        netSalary,
        leaveBalance: currentUser?.leaveBalance || { sick: 8, casual: 10, annual: 14 },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) return;
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
    if (user && ['developer', 'admin', 'ceo', 'manager'].includes(user.role)) {
      fetchDashboardStats();
    }
    fetchTodayState();
    if (user) fetchEmployeeHistory(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-wider text-orange-400">
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
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] selection:bg-orange-500/20 selection:text-orange-400 font-sans">
      {/* ========================================================================= */}
      {/* 1. SIDEBAR (Fixed left on desktop, 3-line hamburger drawer on mobile) */}
      {/* ========================================================================= */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenEditProfile={() => setIsCompleteProfileOpen(true)}
        pendingApprovalsCount={dashboardStats?.pendingLeaves || 0}
      />

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA (Offset by md:pl-64 on desktop for fixed sidebar) */}
      {/* ========================================================================= */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Desktop Top Header matching screenshot */}
        <TopHeader
          user={user}
          activeTab={activeTab}
          onOpenEditProfile={() => setIsCompleteProfileOpen(true)}
          pendingApprovalsCount={dashboardStats?.pendingLeaves || 0}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ========================================================================= */}
          {/* DASHBOARD TAB: ROLE-TAILORED VIEWS (CEO / ADMIN / EMPLOYEE) */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <>
              {isCeo ? (
                /* CEO EXECUTIVE DASHBOARD: Punctuality, Late Flagging Prioritized, Live Site vs Office */
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
          {/* STAFF DIRECTORY TAB (PEOPLE) */}
          {/* ========================================================================= */}
          {activeTab === 'people' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Staff &amp; Workforce Directory</h2>
                  <p className="text-xs text-slate-400 mt-1">Manage team members, roles, work modes (Office vs Site), and Dahua biometric machine IDs</p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  ← Back to Dashboard
                </button>
              </div>
              {isElevatedUser ? (
                <EmployeeDirectory />
              ) : (
                <div className="bg-[#131E36] rounded-[32px] p-8 text-center border border-slate-800 shadow-xs">
                  <p className="text-sm font-semibold text-slate-400">Company directory is managed by HR &amp; Administration.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ATTENDANCE REGISTER TAB (HIRING / ATTENDANCE) */}
          {/* ========================================================================= */}
          {activeTab === 'hiring' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {isElevatedUser ? 'Desk Attendance Register' : 'My Daily Check-In & Attendance'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isElevatedUser
                      ? 'Daily desk sign-in log, biometric verification, and shift records'
                      : 'View check-in status, punch history, and monthly calendar'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
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
                  <AttendanceCalendar currentUserId={user?._id || user?.id} userRole={user?.role} />
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BIOMETRIC DEVICES & FINGERPRINT MANAGER TAB */}
          {/* ========================================================================= */}
          {activeTab === 'biometric' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Biometric Device Integration</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage Dahua fingerprint terminal connections, map employee device IDs, and monitor punch sync
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  ← Back to Dashboard
                </button>
              </div>

              {isElevatedUser ? (
                <BiometricDeviceManager />
              ) : (
                <div className="bg-[#131E36] rounded-[32px] p-8 text-center border border-slate-800 shadow-xs">
                  <p className="text-sm font-semibold text-slate-400">
                    Biometric device configurations are reserved for operations administrators.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* WORK TASKS TAB (APPS / TASKS) */}
          {/* ========================================================================= */}
          {activeTab === 'apps' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Work Tasks &amp; Milestones</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isElevatedUser
                      ? 'Review all submitted daily tasks, achievements, and blockers from workforce'
                      : 'Submit your daily achievements, report blockers, and log project work'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  ← Back to Dashboard
                </button>
              </div>
              <DailyTaskSection userId={!isElevatedUser ? (user?._id || user?.id) : undefined} />
            </div>
          )}

          {/* ========================================================================= */}
          {/* COMPENSATION & SALARY SHEET TAB */}
          {/* ========================================================================= */}
          {activeTab === 'salary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Compensation &amp; Salary Sheet</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isElevatedUser
                      ? 'Staff payroll ledger, auto-deduction calculations, and payslip export'
                      : 'Personal monthly wage summary and payslip breakdown'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  ← Back to Dashboard
                </button>
              </div>
              <SalarySheet
                isEmployeeOnly={!isElevatedUser}
                userId={!isElevatedUser ? (user?._id || user?.id) : undefined}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* ATTENDANCE & SCHEDULE CALENDAR TAB */}
          {/* ========================================================================= */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Attendance &amp; Schedule Calendar</h2>
                  <p className="text-xs text-slate-400 mt-1">Visual monthly view of attendance days, offs, and holidays</p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  ← Back to Dashboard
                </button>
              </div>
              <AttendanceCalendar
                currentUserId={user?._id || user?.id}
                userRole={user?.role}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* LEAVE MANAGEMENT TAB (REVIEWS) */}
          {/* ========================================================================= */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {isElevatedUser ? 'Leave Approvals & Requests' : 'Apply for Leave'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isElevatedUser
                      ? 'Review and approve/reject staff leave applications'
                      : 'Submit leave applications and check approval status'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  ← Back to Dashboard
                </button>
              </div>
              {isElevatedUser ? (
                <LeaveApprovals />
              ) : (
                <LeaveSection userId={user?._id || user?.id} />
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* COMPANY SETTINGS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Portal Configuration &amp; Rules</h2>
                  <p className="text-xs text-slate-400 mt-1">Configure company policies, shift timings, and deduction rules</p>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  ← Back to Dashboard
                </button>
              </div>
              {isElevatedUser ? (
                <CompanySettingsTab />
              ) : (
                <div className="bg-[#131E36] rounded-[32px] p-8 text-center border border-slate-800 shadow-xs">
                  <p className="text-sm font-semibold text-slate-400">Company settings are reserved for administrators.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* DEVELOPER CONSOLE TAB */}
          {/* ========================================================================= */}
          {activeTab === 'developer' && isDeveloper && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <DeveloperConsole />
            </div>
          )}
        </main>
      </div>

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
