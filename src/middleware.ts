import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'skyland_super_secret_jwt_key_2026_portal';
const key = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'skyland_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let isValidSession = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
      });
      if (payload && payload.userId) {
        isValidSession = true;
      }
    } catch {
      isValidSession = false;
    }
  }

  // 1. Protected routes: /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!isValidSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Auth routes: /login, /register -> redirect to /dashboard if already logged in
  if (pathname === '/login' || pathname === '/register') {
    if (isValidSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
