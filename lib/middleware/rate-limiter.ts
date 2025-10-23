// lib/middleware/rate-limiter.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Window in milliseconds
  max: number; // Max number of requests allowed
  message: string; // Message to send when rate limit is exceeded
}

export function createRateLimitHandler(config: RateLimitConfig) {
  return function rateLimitHandler(req: NextRequest): NextResponse | null {
    // Use IP address as the key for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               req.connection.remoteAddress || 
               'unknown';
    
    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();
    const windowEnd = now + config.windowMs;
    
    // Get or create entry for this IP
    let entry = rateLimitStore.get(key);
    if (!entry) {
      entry = { count: 0, resetTime: windowEnd };
      rateLimitStore.set(key, entry);
    }
    
    // Check if window has expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = windowEnd;
    }
    
    // Increment count
    entry.count++;
    
    // Check if rate limit exceeded
    if (entry.count > config.max) {
      return NextResponse.json(
        { error: config.message },
        { status: 429 }
      );
    }
    
    // Set headers for rate limiting info
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', config.max.toString());
    response.headers.set('X-RateLimit-Remaining', (config.max - entry.count).toString());
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
    
    return response;
  };
}

// Specific rate limiters for different routes
export const authRateLimiter = createRateLimitHandler({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimiter = createRateLimitHandler({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
});

export const generalRateLimiter = createRateLimitHandler({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many requests, please try again later',
});