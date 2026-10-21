'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from './login/page';

export default function RootEntryPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasCachedSession, setHasCachedSession] = useState(false);

  useEffect(() => {
    // 1. Fast local check: if session exists in cache, route to dashboard instantly
    try {
      const cached = localStorage.getItem('skyland_user_cache');
      if (cached) {
        const user = JSON.parse(cached);
        if (user && user.email) {
          setHasCachedSession(true);
          router.replace('/dashboard');
          return;
        }
      }
    } catch {}

    // 2. Validate session with server
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.user) {
          try {
            localStorage.setItem('skyland_user_cache', JSON.stringify(data.user));
          } catch {}
          setHasCachedSession(true);
          router.replace('/dashboard');
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => {
        setCheckingSession(false);
      });
  }, [router]);

  // If already authenticated or fast checking, avoid flashing the login screen
  if (hasCachedSession || checkingSession) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-wider text-orange-400">
            Opening Skyland Portal...
          </p>
        </div>
      </div>
    );
  }

  return <LoginPage />;
}
