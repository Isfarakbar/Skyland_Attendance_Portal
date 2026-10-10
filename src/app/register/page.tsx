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
  const [designation, setDesignation] = useState('Team Member');
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">SKYLAND</h2>
        <p className="mt-1 text-sm text-slate-500">Employee Onboarding & Registration</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
          {/* Initial Admin Setup Notification */}
          {isFirstUser && (
            <div className="mb-6 p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Primary Organization Setup</span>
              </div>
              <p className="text-purple-700 leading-relaxed">
                No users currently exist in your database. This initial account will be granted full <strong>Company Administrator</strong> privileges.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Isfar Akbar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field Operations"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Job Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar Technician"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Creating Account & Sending Code...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
