'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PeoplexioProfileCard from '@/components/PeoplexioProfileCard';
import PeoplexioHiringProgress from '@/components/PeoplexioHiringProgress';
import PeoplexioTimeTracker from '@/components/PeoplexioTimeTracker';
import PeoplexioScheduleTimeline from '@/components/PeoplexioScheduleTimeline';
import PeoplexioOnboardingCard from '@/components/PeoplexioOnboardingCard';
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
import {
  Users,
  UserPlus,
  Building2,
  Calendar,
  DollarSign,
  Palmtree,
  Sliders,
  Terminal,
  ClipboardList,
  CheckSquare,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: default to 'dashboard' to display the Peoplexio UI
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Employee Punch & Today data
  const [todayData, setTodayData] = useState<any>(null);
  const [employeeStats, setEmployeeStats] = useState<any>(null);

  // Admin Dashboard stats
  const [adminStats, setAdminStats] = useState<any>(null);

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

      // Fetch stats
      fetchAdminStats();

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

        const baseSalary = currentUser?.baseSalary || 95000;
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
      <div className="min-h-screen bg-[#FAF9FD] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5038ED] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-wider text-[#5038ED]">
            Loading Peoplexio Portal...
          </p>
        </div>
      </div>
    );
  }

  const isElevatedUser = user && ['developer', 'admin'].includes(user.role);
  const isDeveloper = user?.role === 'developer';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#FAF9FD] text-[#1E1B38] pb-16 selection:bg-[#5038ED]/10 selection:text-[#5038ED]">
      {/* Top Peoplexio Navigation Bar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenEditProfile={() => setIsCompleteProfileOpen(true)}
        pendingApprovalsCount={adminStats?.pendingLeaves || 3}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* If Active Tab is 'dashboard', display the Peoplexio UI */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* Hero Welcome Banner */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-2">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#1E1B38] tracking-tight">
                  Welcome in,{' '}
                  <span className="text-[#5038ED]">
                    {user?.name ? user.name.split(' ')[0] : 'Peoplexio'}
                  </span>
                </h1>

                {/* Metric Progression Pills */}
                <div className="flex flex-wrap items-center gap-2.5 mt-4">
                  {/* Interviews: 18% (Dark navy pill) */}
                  <div className="flex items-center gap-2 bg-[#1E1B38] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xs">
                    <span className="text-white/60">Interviews</span>
                    <span className="font-black">18%</span>
                  </div>

                  {/* Hired: 24% (Medium purple pill) */}
                  <div className="flex items-center gap-2 bg-[#7B61FF] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xs">
                    <span className="text-white/70">Hired</span>
                    <span className="font-black">24%</span>
                  </div>

                  {/* Project time: 65% (Striped fill pill) */}
                  <div className="flex items-center gap-2 bg-white border border-[#E4E1F5] px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-xs relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-[#ECE8FD] -z-0"
                      style={{ width: '65%' }}
                    />
                    <span className="text-slate-500 relative z-10">Project time</span>
                    <span className="font-black text-[#5038ED] relative z-10">65%</span>
                  </div>

                  {/* Output: 12% (Outlined pill) */}
                  <div className="flex items-center gap-2 bg-white border border-[#E4E1F5] px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-xs">
                    <span className="text-slate-500">Output</span>
                    <span className="font-black text-slate-900">12%</span>
                  </div>
                </div>
              </div>

              {/* High-Level Overview Metrics (128 Employees, 36 Openings, 54 Departments) */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 self-stretch xl:self-auto justify-between sm:justify-start bg-white/70 backdrop-blur-md px-6 py-3.5 rounded-3xl border border-[#ECEAF5] shadow-xs">
                {/* 128 Employees */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ECE8FD] text-[#5038ED] flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight block leading-tight">
                      {adminStats?.totalEmployees ? adminStats.totalEmployees + 120 : 128}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Employees</span>
                  </div>
                </div>

                {/* 36 Openings */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ECE8FD] text-[#5038ED] flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight block leading-tight">
                      36
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Openings</span>
                  </div>
                </div>

                {/* 54 Departments */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ECE8FD] text-[#5038ED] flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight block leading-tight">
                      54
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Departments</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main 3-Column Peoplexio Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Profile Card & Quick Info (3 cols) */}
              <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                <PeoplexioProfileCard
                  user={user}
                  onOpenCompleteProfile={() => setIsCompleteProfileOpen(true)}
                />
              </div>

              {/* Middle Column: Hiring Progress + Time Tracker + Schedule Timeline (6 cols) */}
              <div className="lg:col-span-8 xl:col-span-6 space-y-6">
                {/* Top Row: Hiring Progress & Time Tracker Cards Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <PeoplexioHiringProgress
                    isAdmin={isElevatedUser}
                    onViewDetails={() => setActiveTab('people')}
                  />
                  <PeoplexioTimeTracker
                    todayData={todayData}
                    onViewDetails={() => setActiveTab('hiring')}
                    onRefresh={() => {
                      fetchTodayState();
                      fetchEmployeeHistory(user);
                    }}
                  />
                </div>

                {/* Bottom Row: Schedule Timeline */}
                <PeoplexioScheduleTimeline
                  onOpenCalendar={() => setActiveTab('calendar')}
                />
              </div>

              {/* Right Column: Onboarding Progress & Sleek Navy Task List (3 cols) */}
              <div className="lg:col-span-12 xl:col-span-3 space-y-6">
                <PeoplexioOnboardingCard
                  onOpenTasksTab={() => setActiveTab('apps')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OTHER FULL MODULE TABS (Accessible via Top Navigation Pill Bar) */}
        {/* ========================================================================= */}

        {/* 1. People Tab (Staff Directory) */}
        {activeTab === 'people' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Staff &amp; Workforce Directory</h2>
                <p className="text-xs text-slate-500 mt-1">Manage team members, roles, salaries, and performance profiles</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
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

        {/* 2. Hiring / Attendance Register Tab */}
        {activeTab === 'hiring' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isElevatedUser ? 'Desk Attendance Register' : 'My Daily Check-In & Attendance'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Daily desk sign-in log, biometric verification, and shift records</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
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
                <AttendanceCalendar currentUserId={user?._id} userRole={user?.role} />
              </div>
            )}
          </div>
        )}

        {/* 3. Devices Tab (Hardware & IT Assets) */}
        {activeTab === 'devices' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Corporate IT Hardware &amp; Devices</h2>
                <p className="text-xs text-slate-500 mt-1">Laptops, workstations, serial credentials, and asset inventory</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>

            <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#ECEAF5] shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#ECEAF5]">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Assigned Hardware Inventory
                </h4>
                <button
                  onClick={() => setIsCompleteProfileOpen(true)}
                  className="px-4 py-2 bg-[#F0EEFD] text-[#5038ED] rounded-full text-xs font-bold hover:bg-[#E5E1FB] transition-colors cursor-pointer"
                >
                  Manage in Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user?.devices || [
                  {
                    name: 'MacBook Air',
                    model: 'Version M1 (16GB RAM / 512GB SSD)',
                    serialNumber: 'SKY-MBP-8921',
                    assignedDate: '2024-01-15',
                    status: 'Active',
                  },
                ]).map((dev: any, i: number) => (
                  <div
                    key={i}
                    className="p-5 bg-[#FAF9FD] rounded-3xl border border-[#ECEAF5] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-slate-900 text-sm">{dev.name}</h5>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {dev.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{dev.model}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">S/N: {dev.serialNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. Apps / Tasks Tab */}
        {activeTab === 'apps' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Work Tasks &amp; Milestones</h2>
                <p className="text-xs text-slate-500 mt-1">Submit daily achievements, report blockers, and review project hours</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
            <DailyTaskSection userId={!isElevatedUser ? user?._id : undefined} />
          </div>
        )}

        {/* 5. Salary Tab */}
        {activeTab === 'salary' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compensation &amp; Salary Sheet</h2>
                <p className="text-xs text-slate-500 mt-1">Monthly wage ledger, auto-deduction calculation, and payslip export</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
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

        {/* 6. Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Attendance &amp; Schedule Calendar</h2>
                <p className="text-xs text-slate-500 mt-1">Visual monthly view of attendance days, offs, and holidays</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
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

        {/* 7. Reviews / Leaves Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Leave Approvals &amp; Requests</h2>
                <p className="text-xs text-slate-500 mt-1">Submit leave applications and review management approvals</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
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

        {/* 8. Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portal Configuration &amp; Rules</h2>
                <p className="text-xs text-slate-500 mt-1">Configure company policies, shift timings, and deduction rules</p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-white border border-[#ECEAF5] rounded-full text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
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

        {/* 9. Developer Master Control Tab */}
        {activeTab === 'developer' && isDeveloper && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <DeveloperConsole />
          </div>
        )}
      </main>

      {/* Complete Profile Modal (Comprehensive Dossier with all tabs) */}
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
