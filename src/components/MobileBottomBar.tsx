'use client';

import React from 'react';
import { 
  ClipboardList, 
  Users, 
  FileSpreadsheet, 
  Sliders, 
  Terminal, 
  Calendar, 
  CheckSquare, 
  DollarSign, 
  Palmtree, 
  MapPin, 
  Clock 
} from 'lucide-react';

interface MobileBottomBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role?: string;
  workMode?: 'OFFICE' | 'FIELD';
  pendingLeaves?: number;
}

interface MobileTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function MobileBottomBar({
  activeTab,
  setActiveTab,
  role,
  workMode,
  pendingLeaves = 0,
}: MobileBottomBarProps) {
  const isSuperAdmin = role === 'developer';
  const isAdmin = role === 'admin';
  const isElevated = isSuperAdmin || isAdmin;

  // Exact 4 primary buttons for elevated management
  const managementButtons: MobileTabItem[] = isSuperAdmin
    ? [
        { id: 'developer', label: 'Master', icon: Terminal },
        { id: 'register', label: 'Register', icon: ClipboardList },
        { id: 'directory', label: 'Staff', icon: Users },
        { id: 'salary', label: 'Payroll', icon: FileSpreadsheet },
      ]
    : [
        { id: 'register', label: 'Register', icon: ClipboardList },
        { id: 'directory', label: 'Staff', icon: Users },
        { id: 'salary', label: 'Payroll', icon: FileSpreadsheet },
        { id: 'approvals', label: 'Leaves', icon: Palmtree, badge: pendingLeaves },
      ];

  // Exact 4 primary buttons for employees (Office vs Site)
  const employeeButtons: MobileTabItem[] = [
    {
      id: 'attendance',
      label: workMode === 'FIELD' ? 'Site Check' : 'My Status',
      icon: workMode === 'FIELD' ? MapPin : Clock,
    },
    { id: 'tasks', label: 'Daily Work', icon: CheckSquare },
    { id: 'calendar', label: 'History', icon: Calendar },
    { id: 'salary', label: 'My Salary', icon: DollarSign },
  ];

  const buttons = isElevated ? managementButtons : employeeButtons;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-safe">
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeTab === btn.id;

          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setActiveTab(btn.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-indigo-600' : 'text-slate-500'}`} />
                {btn.badge && btn.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {btn.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] mt-1 leading-tight tracking-tight truncate max-w-full ${isActive ? 'text-indigo-700 font-extrabold' : 'text-slate-500'}`}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
