// lib/security/csrf.ts
import { randomBytes } from 'crypto';

// Simple in-memory store for CSRF tokens (use Redis in production)
const csrfTokens = new Map<string, string>();

export function generateCSRFToken(): string {
  const token = randomBytes(32).toString('hex');
  return token;
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken;
}

export function storeCSRFToken(userId: string, token: string): void {
  csrfTokens.set(userId, token);
}

export function getCSRFToken(userId: string): string | undefined {
  return csrfTokens.get(userId);
}

export function clearCSRFToken(userId: string): void {
  csrfTokens.delete(userId);
}