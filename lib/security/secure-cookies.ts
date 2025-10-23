// lib/security/secure-cookies.ts
import { cookies } from 'next/headers';

/**
 * Sets a secure cookie with common security options
 */
export function setSecureCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): void {
  const defaultOptions = {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    ...options
  };

  cookies().set(name, value, defaultOptions);
}

/**
 * Gets a cookie value
 */
export function getCookie(name: string): string | undefined {
  return cookies().get(name)?.value;
}

/**
 * Deletes a cookie
 */
export function deleteCookie(name: string): void {
  cookies().delete(name);
}