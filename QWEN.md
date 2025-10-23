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

Security Gaps Identified:
1. No rate limiting implemented
2. No CSRF protection
3. No XSS protection headers
4. No input validation/sanitization (no Zod schemas)
5. No security headers in Next.js
6. Referral code cookies are httpOnly but could use additional security measures
7. Potential for brute force attacks on authentication endpoints
8. No account lockout mechanisms
9. No monitoring for suspicious activity patterns

Recommended Security Improvements:
1. Implement rate limiting for authentication endpoints
2. Add CORS and security headers configuration
3. Implement CSRF protection
4. Add input validation with Zod schemas
5. Add XSS protection headers
6. Implement account lockout after failed attempts
7. Add monitoring and logging for security events
8. Implement DDoS protection at infrastructure level

Best Practices to Implement:
1. Clean, readable code with proper error handling
2. Consistent naming conventions
3. Modular, well-structured components
4. Proper separation of concerns
5. Comprehensive logging and monitoring
6. Regular security audits
7. Input sanitization and validation
8. Secure coding practices
