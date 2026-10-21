'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  DollarSign,
  Calendar,
  Palmtree,
  Sliders,
  LogOut,
  Edit3,
  Menu,
  X,
  Bell,
  Fingerprint,
  Smartphone,
  Download,
} from 'lucide-react';

interface AuthUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'developer' | 'admin' | 'ceo' | 'manager' | 'employee' | string;
  employeeId?: string;
  department?: string;
  designation?: string;
  avatarUrl?: string;
  workMode?: 'OFFICE' | 'FIELD';
  baseSalary?: number;
}

interface SidebarProps {
  user: AuthUser | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenEditProfile: () => void;
  pendingApprovalsCount?: number;
}

export default function Sidebar({
  user,
  activeTab,
  onSelectTab,
  onOpenEditProfile,
  pendingApprovalsCount = 0,
}: SidebarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const isDeveloper = user?.role === 'developer';
  const isAdmin = user?.role === 'admin' || isDeveloper;
  const isCeo = user?.role === 'ceo' || user?.designation?.toLowerCase().includes('ceo');
  const isElevated = isAdmin || isCeo;

  const handleLogout = async () => {
    try {
      localStorage.removeItem('skyland_user_cache');
    } catch {}
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = isElevated
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'people', label: 'Staff Directory', icon: Users },
        { id: 'hiring', label: 'Attendance Register', icon: Clock },
        { id: 'apps', label: 'Task Reports', icon: CheckSquare },
        { id: 'salary', label: 'Salary Sheet', icon: DollarSign },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        {
          id: 'reviews',
          label: 'Leave Approvals',
          icon: Palmtree,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
        { id: 'settings', label: 'Settings', icon: Sliders },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'hiring', label: 'My Attendance', icon: Clock },
        { id: 'apps', label: 'Daily Work', icon: CheckSquare },
        { id: 'salary', label: 'My Payslip', icon: DollarSign },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'reviews', label: 'Leave Requests', icon: Palmtree },
      ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  const getRoleLabel = () => {
    if (isCeo) return 'Chief Executive (CEO)';
    if (isAdmin) return 'Operations Admin';
    return 'Employee';
  };

  const getRoleBadgeStyle = () => {
    if (isCeo) return 'bg-purple-950/80 text-purple-300 border-purple-800/80';
    if (isAdmin) return 'bg-orange-950/80 text-orange-300 border-orange-800/80';
    return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP NAVBAR (3-Line Hamburger Header) */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0D1527]/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo in Mobile Navbar */}
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="bg-white rounded-xl p-1 shadow-xs w-9 h-9 flex items-center justify-center">
              <img src="/skyland-icon.png" alt="Skyland App Icon" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-sm text-white tracking-tight">SKYLAND</span>
          </div>
        </div>

        {/* Right side mobile controls: install + notifications + profile avatar */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
            className="h-8 px-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[#FF6B00] hover:bg-orange-500/20 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Install App"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[11px] font-black">Install</span>
          </button>

          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
            aria-label="Toggle notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6B00] text-white text-[9px] font-black flex items-center justify-center">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-72 bg-[#0D1527] rounded-2xl shadow-2xl border border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Portal Alerts
                </span>
                <span className="text-[10px] font-bold text-orange-400">
                  {pendingApprovalsCount} Pending
                </span>
              </div>
              <div className="space-y-2 pt-2.5 text-xs">
                {pendingApprovalsCount > 0 && (
                  <div
                    onClick={() => {
                      setNotifOpen(false);
                      handleNavClick('reviews');
                    }}
                    className="p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/30 text-orange-200 cursor-pointer hover:bg-orange-950/60 transition-colors"
                  >
                    <p className="font-bold text-white text-xs">Pending Leave Requests</p>
                    <p className="text-[11px] text-orange-300 mt-0.5">{pendingApprovalsCount} staff applications awaiting review</p>
                  </div>
                )}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <p className="font-bold text-white text-xs">GPS Self-Attendance</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Live GPS &amp; manual register active</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onOpenEditProfile}
            className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-[#FF6B00] to-orange-400 border border-orange-500/50 flex items-center justify-center text-white font-bold text-xs cursor-pointer"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name?.charAt(0) || 'U'}</span>
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE DRAWER SLIDE-OVER (Opened via 3-Line Hamburger) */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Slide-out Menu Panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-[#0D1527] border-r border-slate-800 p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Top Brand + Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="bg-white rounded-xl p-1.5 shadow-sm w-10 h-10 flex items-center justify-center">
                    <img src="/skyland-icon.png" alt="Skyland App Icon" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="font-black text-sm text-white tracking-wider block leading-tight">SKYLAND ENERGY</span>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">ATTENDANCE PORTAL</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card inside Drawer */}
              {user && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#FF6B00] to-orange-400 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-orange-500/40">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.name?.charAt(0) || 'U'}</span>
                      )}
                      <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getRoleBadgeStyle()}`}
                      >
                        {getRoleLabel()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenEditProfile();
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700/60"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Edit Profile Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.dispatchEvent(new CustomEvent('open-pwa-install'));
                    }}
                    className="w-full py-2 bg-gradient-to-r from-[#FF6B00] to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install App on Phone</span>
                  </button>
                </div>
              )}

              {/* Mobile Navigation List */}
              <nav className="space-y-1 pt-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/30 font-black'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-slate-900">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Drawer Logout */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DESKTOP FIXED LEFT SIDEBAR (Matching Screenshot Structure) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-[#0D1527] border-r border-slate-800/80 z-30 justify-between select-none">
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Top Brand with Skyland Left-Side Graphical Logo */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer p-1 group"
          >
            <div className="bg-white rounded-2xl p-2 shadow-md shadow-orange-500/10 w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
              <img
                src="/skyland-icon.png"
                alt="Skyland App Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-wider block leading-tight">
                SKYLAND ENERGY
              </span>
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">
                OPERATIONS
              </span>
            </div>
          </div>

          {/* Desktop User Profile Card (Matching Screenshot Left Badge) */}
          {user && (
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-[#FF6B00] to-orange-400 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-orange-500/40">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.name?.charAt(0) || 'U'}</span>
                  )}
                  <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-xs text-white truncate max-w-[120px]">
                      {user.name}
                    </p>
                    <span className="px-1.5 py-0.2 rounded-sm text-[8px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Online
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getRoleBadgeStyle()}`}
                >
                  {getRoleLabel()}
                </span>

                <button
                  onClick={onOpenEditProfile}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold transition-colors cursor-pointer"
                  title="Edit profile photo and details"
                >
                  <Edit3 className="w-3 h-3 text-[#FF6B00]" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Items (Orange Pill on Active, Slate on Inactive) */}
          <nav className="space-y-1 pt-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/25 font-black scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-slate-900 shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Logout Button */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
