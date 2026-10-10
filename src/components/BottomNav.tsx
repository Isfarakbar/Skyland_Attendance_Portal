'use client';

import React from 'react';
import { 
  Calendar, 
  ClipboardList, 
  Users, 
  CheckSquare, 
  DollarSign, 
  Palmtree, 
  Sliders, 
  Terminal,
  Clock,
  Compass
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role?: string;
  workMode?: 'OFFICE' | 'FIELD';
  pendingLeaves?: number;
}

interface NavTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  role,
  workMode,
  pendingLeaves = 0,
}: BottomNavProps) {
  const isSuperAdmin = role === 'developer';
  const isAdmin = role === 'admin';
  const isElevated = isSuperAdmin || isAdmin;

  // Tabs for Elevated Management (Super Admin & Admin)
  const elevatedTabs: NavTabItem[] = [
    ...(isSuperAdmin
      ? [{ id: 'developer', label: 'Master', icon: Terminal }]
      : []),
    { id: 'register', label: 'Register', icon: ClipboardList },
    { id: 'directory', label: 'Staff', icon: Users },
    { id: 'salary', label: 'Payroll', icon: DollarSign },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'approvals', label: 'Leaves', icon: Palmtree, badge: pendingLeaves },
    { id: 'settings', label: 'Rules', icon: Sliders },
  ];

  // Tabs for Regular Employees (Office vs Site)
  const employeeTabs: NavTabItem[] = [
    { 
      id: 'attendance', 
      label: workMode === 'FIELD' ? 'Site Check-In' : 'My Status', 
      icon: workMode === 'FIELD' ? Compass : Clock 
    },
    { id: 'tasks', label: 'Daily Work', icon: CheckSquare },
    { id: 'calendar', label: 'History', icon: Calendar },
    { id: 'salary', label: 'My Salary', icon: DollarSign },
    { id: 'leaves', label: 'Apply Leave', icon: Palmtree },
  ];

  const tabs = isElevated ? elevatedTabs : employeeTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 py-2 pb-5 sm:pb-3 max-w-lg mx-auto pointer-events-none">
      <div className="pointer-events-auto glass-panel rounded-full p-1.5 flex items-center justify-around shadow-2xl border border-white/10 shadow-black/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-2.5 rounded-full transition-all duration-300 cursor-pointer min-w-[52px] ${
                isActive
                  ? 'btn-orange-glow text-white scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-semibold tracking-tight mt-0.5 truncate max-w-[58px] ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>

              {/* Notification Badge */}
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border border-black shadow-xs">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
