'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from './login/page';

export default function RootEntryPage() {
  const router = useRouter();

  useEffect(() => {
    // If user already has an active session, jump straight to /dashboard
    // Keeping '/' as HTTP 200 OK ensures Android Chrome WebAPK installation never fails on a start_url redirect
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.user) {
          router.replace('/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  return <LoginPage />;
}
