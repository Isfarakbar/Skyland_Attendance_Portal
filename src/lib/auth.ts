import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { UserRole } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'skyland_super_secret_jwt_key_2026_portal';
const key = new TextEncoder().encode(JWT_SECRET);

export const COOKIE_NAME = 'skyland_token';
// 365 days persistent session so employees never have to log in daily after installing the app
export const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId: string;
  department: string;
  designation: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('365d')
    .sign(key);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: TokenPayload): Promise<string> {
  const token = await signToken(payload);
  const cookieStore = await cookies();
  const expiresDate = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === 'production' ||
      process.env.COOKIE_SECURE === 'true' ||
      process.env.VERCEL === '1',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresDate,
  });
  return token;
}

export async function removeSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
