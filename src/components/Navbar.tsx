'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Clock, Building2, ChevronDown, Smartphone, Sun } from 'lucide-react';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'admin' | 'manager' | 'employee' | string;
  employeeId: string;
  department: string;
  designation: string;
}

interface NavbarProps {
  user: AuthUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [time, setTime] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'developer':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono';
      case 'admin':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'developer':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return 'Staff Member';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0d120f]/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Sun className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-wider">SKYLAND</span>
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
                  Solar
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Workforce &amp; Attendance Hub</p>
            </div>
          </div>

          {/* Center: Live Digital Clock */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 glass-card rounded-full text-slate-300">
            <Clock className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-xs text-slate-400">Live Clock:</span>
            <span className="text-sm font-mono font-bold text-white tracking-wider">{time || '--:--:--'}</span>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Install App Quick Action */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-pwa-install'));
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              title="Install / Download Skyland App on your Phone"
            >
              <Smartphone className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Install App</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-3 p-1.5 pl-3 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{user.employeeId}</span>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-orange-500/30">
                    {user.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 glass-panel rounded-3xl shadow-2xl py-2 z-50 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Signed in as</p>
                      <p className="text-sm font-black text-white truncate mt-0.5">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <p className="text-xs text-orange-400 mt-1 font-semibold">{user.department} • {user.designation}</p>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Log In
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 text-xs font-bold text-white btn-orange-glow rounded-xl"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
