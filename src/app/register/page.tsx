'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'developer' | 'admin' | 'manager' | 'employee'>('employee');
  const [department, setDepartment] = useState('Operations');
  const [designation, setDesignation] = useState('Employee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/setup-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.isFirstUser) {
          setIsFirstUser(true);
          setRole('developer');
          setDepartment('Engineering / Tech');
          setDesignation('System Developer');
        } else {
          setIsFirstUser(false);
          setRole('employee');
          setDepartment('Operations');
          setDesignation('Employee');
        }
      })
      .catch(() => setIsFirstUser(false));
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Name, email, and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          password,
          role,
          department,
          designation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
      }
    } catch {
      setError('Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="mx-auto w-48 mb-3 p-3 rounded-2xl bg-white shadow-xl flex items-center justify-center">
          <img
            src="/skyland-logo.png"
            alt="Skyland Energy"
            className="w-full h-auto max-h-16 object-contain"
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">SKYLAND ENERGY</h2>
        <p className="mt-1 text-xs text-slate-400">Employee Onboarding &amp; Registration</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0 relative z-10">
        <div className="bg-[#0D1527] py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-800">
          {/* Initial Admin Setup Notification */}
          {isFirstUser && (
            <div className="mb-6 p-4 rounded-2xl bg-orange-950/40 border border-orange-500/30 text-orange-200 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1 text-[#FF6B00]">
                <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
                <span>Primary Organization Setup</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                No users currently exist in your database. This initial account will be granted full <strong>System Administrator</strong> privileges.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Isfar Akbar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@skylandenergy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Job Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar Engineer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-[#FF6B00] to-amber-600 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Creating Account & Sending Code...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-[#FF6B00] hover:text-amber-400">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
