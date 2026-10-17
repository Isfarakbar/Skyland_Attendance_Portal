'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  LogOut,
  Edit3,
} from 'lucide-react';

interface TopHeaderProps {
  user: any;
  activeTab: string;
  onOpenEditProfile: () => void;
  pendingApprovalsCount?: number;
}

export default function TopHeader({
  user,
  activeTab,
  onOpenEditProfile,
  pendingApprovalsCount = 0,
}: TopHeaderProps) {
  const router = useRouter();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Operations Dashboard';
      case 'people':
        return 'Staff & Workforce Directory';
      case 'hiring':
        return 'Desk Attendance Register';
      case 'apps':
        return 'Work Tasks & Milestones';
      case 'salary':
        return 'Compensation & Salary Sheet';
      case 'calendar':
        return 'Attendance & Schedule Calendar';
      case 'reviews':
        return 'Leave Approvals & Requests';
      case 'settings':
        return 'Portal Configuration & Rules';
      default:
        return 'Operations Hub';
    }
  };

  const isElevated = user && ['developer', 'admin', 'ceo', 'manager'].includes(user.role);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-6 lg:px-8 border-b border-slate-800/80 bg-[#0D1527]/80 backdrop-blur-md sticky top-0 z-20">
      {/* Left: Breadcrumbs matching screenshot: WORKSPACE / Dashboard */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
          WORKSPACE
        </span>
        <span className="text-slate-600 font-bold">/</span>
        <span className="text-sm font-black text-white tracking-tight">
          {getBreadcrumbTitle()}
        </span>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            user?.role === 'ceo'
              ? 'bg-purple-950/80 text-purple-300 border-purple-800'
              : isElevated
              ? 'bg-orange-950/80 text-orange-300 border-orange-800'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}
        >
          {user?.role === 'ceo' ? '👑 CEO' : isElevated ? '⚡ Master Admin' : '👤 Employee'}
        </span>
      </div>

      {/* Right Controls: Install App, GPS status, notifications, Edit Profile, Logout */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
          className="px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[#FF6B00] text-xs font-bold transition-all cursor-pointer"
        >
          📲 Install App
        </button>

        {/* GPS Attendance live status pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-bold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>GPS Attendance Active</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6B00] text-white text-[9px] font-black flex items-center justify-center">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Portal Alerts
                </span>
                <span className="text-[10px] font-bold text-orange-400">
                  {pendingApprovalsCount} Pending
                </span>
              </div>
              <div className="space-y-2 pt-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition-colors">
                  <p className="font-bold text-white text-xs">GPS Self-Attendance Active</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All employees can check in &amp; out with live GPS</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition-colors">
                  <p className="font-bold text-white text-xs">Manual Desk Register</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Admin manual attendance &amp; overrides enabled</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={onOpenEditProfile}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Edit Profile</span>
        </button>

        {/* Log Out Button */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
