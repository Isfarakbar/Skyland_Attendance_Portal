'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, User, ArrowRight, ShieldCheck, Sun, Building, MapPin } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'developer' | 'admin' | 'manager' | 'employee'>('employee');
  const [department, setDepartment] = useState('Operations');
  const [designation, setDesignation] = useState('Team Member');
  const [workMode, setWorkMode] = useState<'OFFICE' | 'FIELD'>('OFFICE');
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
          setDesignation('Team Member');
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
          workMode,
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
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="mx-auto h-16 w-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 mb-4 border border-white/20">
          <Sun className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">SKYLAND</h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-orange-400 font-bold">
          Employee Onboarding
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-white/10">
          {/* Initial Setup Notification */}
          {isFirstUser && (
            <div className="mb-6 p-4 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-200 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                <span>Primary Organization Setup</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                First account initialized will receive root <strong>Super Admin</strong> access.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-orange-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Andy Bernard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 glass-input rounded-2xl text-xs placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-orange-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 glass-input rounded-2xl text-xs placeholder-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field Operations"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-2xl text-xs placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Job Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar Technician"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-4 py-3 glass-input rounded-2xl text-xs placeholder-slate-500"
                />
              </div>
            </div>

            {/* Work Mode / Location Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Work Type / Location</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWorkMode('OFFICE')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    workMode === 'OFFICE'
                      ? 'border-orange-500 bg-orange-500/20 ring-2 ring-orange-500/40'
                      : 'border-white/10 glass-card hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                    <Building className="w-3.5 h-3.5 text-orange-400" />
                    <span>Office Staff</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Marked daily at desk by Admin
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkMode('FIELD')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    workMode === 'FIELD'
                      ? 'border-orange-500 bg-orange-500/20 ring-2 ring-orange-500/40'
                      : 'border-white/10 glass-card hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span>Site Worker</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Self check-in via GPS pin
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-orange-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 glass-input rounded-2xl text-xs placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 btn-orange-glow text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Submitting Application...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-orange-400 hover:text-orange-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
