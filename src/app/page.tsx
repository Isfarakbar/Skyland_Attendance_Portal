'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Clock, ArrowRight, Users, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          router.replace('/dashboard');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 flex flex-col justify-between relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#0D1527]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1.5 shadow-md flex items-center justify-center">
              <img src="/skyland-logo.png" alt="Skyland Energy" className="h-7 w-auto object-contain" />
            </div>
            <span className="font-black text-lg text-white tracking-tight">SKYLAND ENERGY</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-500 hover:to-[#FF6B00] rounded-xl shadow-md shadow-orange-500/20 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center my-auto relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
          Solar Energy Workforce &amp; Biometric Attendance Portal
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Intelligent Attendance for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-amber-400">Skyland Energy</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Dahua Biometric Terminal integration, live GPS field check-ins, automated leave quotas, real-time FBR tax withholding, and payroll Excel exports.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#FF6B00] to-amber-600 hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-orange-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>Enter Attendance Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold border border-slate-800 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>Employee Registration</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          <div className="p-6 bg-[#0D1527] border border-slate-800 rounded-3xl shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Dahua &amp; GPS Attendance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Biometric ASA1222G fingerprint syncing for office staff and mobile GPS location verification for site engineers.
            </p>
          </div>

          <div className="p-6 bg-[#0D1527] border border-slate-800 rounded-3xl shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Role-Based Staff Directory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full employee dossiers, assigned company equipment tracking, leave balance controls, and strict employee self-service boundaries.
            </p>
          </div>

          <div className="p-6 bg-[#0D1527] border border-slate-800 rounded-3xl shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Payroll &amp; Tax Deduction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monthly leave allowances (1 free off, 2 free half leaves), FBR tax slabs, itemized payslips, and instant .xlsx export for accountants.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0D1527]/50 py-6 text-center text-xs text-slate-500 relative z-10">
        &copy; 2026 Skyland Energy. All rights reserved.
      </footer>
    </div>
  );
}
