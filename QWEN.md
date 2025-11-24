## Qwen Added Memories
- Giya is a hyperlocal discovery and loyalty program platform with three user roles: customers (earn points at businesses), businesses (create loyalty programs), and influencers (earn commissions through affiliate marketing). Built with Next.js 15, TypeScript, Supabase, using Vercel Blob for profile images and Supabase Storage for offer images. Features include QR-based loyalty system, affiliate marketing, points/rewards system, and RLS database security.
- Giya security measures and best practices:

Current Security Features:
1. Row Level Security (RLS) - All database tables have RLS policies ensuring users can only access their own data
2. Multi-role authentication with Supabase Auth
3. OAuth with Google and email/password
4. Middleware-based session management
5. Referral code tracking with secure cookie storage (httpOnly)
6. Data isolation between customer/business/influencer roles
7. Foreign key constraints to maintain data integrity
8. Rate limiting implemented via custom in-memory rate limiter (lib/middleware/rate-limiter.ts)
9. Security headers configured in next.config.mjs (X-Frame-Options, X-Content-Type-Options, etc.)
10. CSRF protection via Supabase OAuth state parameter and dedicated lib/security/csrf.ts
11. Input validation with Zod schemas (lib/validation/auth.ts and lib/validation/index.ts)
12. Security monitoring with PostHog integration

Security Gaps Identified:
1. No comprehensive account lockout mechanism after failed attempts
2. No infrastructure-level DDoS protection
3. Limited server-side security event logging

Recommended Security Improvements:
1. Implement comprehensive account lockout mechanism after failed authentication attempts
2. Enhance server-side security event logging
3. Implement infrastructure-level DDoS protection (Cloudflare, etc.)
4. Enhance CSRF protection for API routes
5. Add more detailed security monitoring

Best Practices Implemented:
1. Clean, readable code with proper error handling
2. Consistent naming conventions
3. Modular, well-structured components
4. Proper separation of concerns
5. Comprehensive logging and monitoring
6. Regular security audits
7. Input sanitization and validation with Zod
8. Secure coding practices
- Giya Security Implementation Details:
1. Current Status: Rate limiting, security headers (including CSP), CSRF protection, Zod validation, and basic monitoring are implemented. Missing: proper account lockout mechanism, and infrastructure-level DDoS protection.
2. Recommended Code-Only Improvements: 
   - Content Security Policy in next.config.mjs
   - Enhanced security logging using existing error handling infrastructure
   - Basic account lockout system (in-memory for single instance)
   - Enhanced CSRF protection 
3. Safe Implementation Strategy: 
   - Phase 1: Security logging (low risk)
   - Phase 2: Account lockout with high thresholds 
   - Phase 3: CSP with gradual tightening
4. Potential Outcomes: Improved security but possible breaking changes if CSP is too restrictive; users might be locked out if thresholds are too low
5. Minimal Risk Approach: Start with security logging only to monitor before making functional changes
