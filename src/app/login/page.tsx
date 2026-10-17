'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          setError('Email verification required. Redirecting to verification page...');
          setTimeout(() => {
            router.push(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
          }, 1000);
        } else {
          setError(data.error || 'Invalid credentials');
        }
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Network error during authentication');
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
        <p className="mt-1 text-xs text-slate-400">Workforce &amp; GPS Attendance Portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="bg-[#0D1527] py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-800">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Company Email</label>
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 uppercase">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#FF6B00] hover:text-amber-400"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-[#FF6B00] to-amber-600 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-800 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-orange-500/30 text-[#FF6B00] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📲 Install Skyland Attendance App</span>
            </button>

            <div className="text-center text-xs text-slate-400">
              Need an account?{' '}
              <Link href="/register" className="font-bold text-[#FF6B00] hover:text-amber-400">
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
