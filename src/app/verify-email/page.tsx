'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, ShieldCheck, Mail, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code || code.trim().length < 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
      } else {
        setSuccessMsg('Email verified successfully! Redirecting to portal...');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1200);
      }
    } catch {
      setError('Network error during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;

    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend code');
      } else {
        setSuccessMsg('A new 6-digit code has been sent to your email inbox!');
        setResendCooldown(60); // 60s cooldown
      }
    } catch {
      setError('Network error resending code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="mx-auto w-20 h-20 mb-3.5 p-2.5 rounded-3xl bg-white shadow-2xl shadow-orange-500/15 flex items-center justify-center border border-white/80">
          <img
            src="/skyland-icon.png"
            alt="Skyland App Icon"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Verify Your Email</h2>
        <p className="mt-1 text-xs text-slate-400">Security verification code sent to your email inbox</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <div className="bg-[#0D1527] py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-800">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Account Email</label>
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
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                6-Digit Security Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[8px] font-mono text-2xl font-bold py-3 bg-slate-900 border border-slate-800 rounded-xl text-[#FF6B00] focus:outline-hidden focus:ring-2 focus:ring-[#FF6B00] transition-all"
              />
              <p className="text-[11px] text-slate-400 text-center mt-1">Check your inbox or spam folder</p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3 bg-linear-to-r from-[#FF6B00] to-amber-600 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Enter Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Resend button */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Didn&apos;t receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="font-bold text-[#FF6B00] hover:text-amber-400 disabled:text-slate-500 flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Back to{' '}
            <Link href="/login" className="font-bold text-[#FF6B00] hover:text-amber-400">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
