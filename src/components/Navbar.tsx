'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Settings,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Smartphone,
  Shield,
  Laptop,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface AuthUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'developer' | 'admin' | 'manager' | 'employee' | string;
  employeeId?: string;
  department?: string;
  designation?: string;
  avatarUrl?: string;
  baseSalary?: number;
}

interface NavbarProps {
  user: AuthUser | null;
  onOpenEditProfile?: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  pendingApprovalsCount?: number;
}

export default function Navbar({
  user,
  onOpenEditProfile,
  activeTab = 'dashboard',
  onSelectTab,
  pendingApprovalsCount = 3,
}: NavbarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'people', label: 'People' },
    { id: 'hiring', label: user?.role === 'employee' ? 'Attendance' : 'Hiring' },
    { id: 'devices', label: 'Devices' },
    { id: 'apps', label: 'Tasks' },
    { id: 'salary', label: 'Salary' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'reviews', label: 'Reviews' },
  ];

  const handleTabClick = (id: string) => {
    if (onSelectTab) {
      onSelectTab(id);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9FD]/90 backdrop-blur-xl border-b border-[#ECEAF5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Left Brand: Skyland Energy Mark */}
          <div
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer shrink-0 select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25">
              {/* Stylized 'S' solar energy mark */}
              <span className="font-black text-2xl font-sans tracking-tighter">S</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl text-[#1E1B38] tracking-tight">
                  Skyland Energy
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                Workforce & Attendance Hub
              </p>
            </div>
          </div>

          {/* Center: Floating Pill Navigation Bar (matching image) */}
          <nav className="hidden lg:flex items-center bg-white/80 border border-[#ECEAF5] rounded-full p-1.5 shadow-[0_2px_12px_rgba(30,27,56,0.03)] space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3D299E] text-white shadow-md shadow-[#3D299E]/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF9FD]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Settings Pill, Notification Bell with 3 badge, and User Avatar */}
          <div className="flex items-center gap-3">
            {/* Settings Pill Button */}
            <button
              onClick={() => handleTabClick('settings')}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#3D299E] text-white border-transparent'
                  : 'bg-white/80 hover:bg-white text-slate-700 border-[#ECEAF5] shadow-xs'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            {/* Notification Bell with Badge 3 */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-[#ECEAF5] flex items-center justify-center text-slate-700 shadow-xs transition-all cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingApprovalsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#3D299E] text-white text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-[#ECEAF5] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h5 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                      Pending Alerts &amp; Activities
                    </h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECE8FD] text-[#3D299E]">
                      {pendingApprovalsCount} New
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-3 text-xs">
                    <div className="p-2.5 rounded-2xl bg-[#FAF9FD] hover:bg-[#F3F0FD] transition-colors cursor-pointer">
                      <p className="font-bold text-slate-900">Desk Attendance Marked</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Reception recorded arrival time at 09:15 AM</p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[#FAF9FD] hover:bg-[#F3F0FD] transition-colors cursor-pointer">
                      <p className="font-bold text-slate-900">Salary Slip Ready</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Monthly payroll summary processed</p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[#FAF9FD] hover:bg-[#F3F0FD] transition-colors cursor-pointer">
                      <p className="font-bold text-slate-900">Device Audit Completed</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">MacBook Air M1 verified active</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Pill & Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-tr from-[#5038ED] to-[#8F79FC] flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.name?.charAt(0) || 'U'}</span>
                  )}
                </button>

                {/* Profile Popover Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-[#ECEAF5] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-[#F0EEF8] flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-[#ECE8FD] text-[#5038ED] flex items-center justify-center font-bold text-base shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{user.name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-extrabold text-slate-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {user.designation || 'Team Member'}
                        </p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#ECE8FD] text-[#5038ED]">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-1">
                      {onOpenEditProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenEditProfile();
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-bold text-[#5038ED] hover:bg-[#F0EEFD] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-[#5038ED]" />
                          <span>View Complete Profile</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('open-pwa-install'));
                          }
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-slate-500" />
                        <span>Install App</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Subnavigation Pill Row */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto no-scrollbar py-2.5 border-t border-[#ECEAF5]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#3D299E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
