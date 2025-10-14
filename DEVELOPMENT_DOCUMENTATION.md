# Giya Development Documentation

This document consolidates all the development documentation for the Giya application, a loyalty program platform that connects customers, businesses, and influencers.

## Table of Contents
1. [Project Overview](#project-overview)
2. [User Roles and Features](#user-roles-and-features)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Affiliate System](#affiliate-system)
7. [Loyalty Program Features](#loyalty-program-features)
8. [Image Storage System](#image-storage-system)
9. [QR Code Implementation](#qr-code-implementation)
10. [Offer Systems](#offer-systems)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)

## Project Overview

Giya is a hyperlocal discovery and loyalty program application built with Next.js 15, TypeScript, and Supabase. The platform allows customers to earn points at local businesses, redeem rewards, and discover new places through a QR-based system. Businesses can create loyalty programs and rewards, while influencers can earn commissions through affiliate marketing.

### Key Features
- Customer points earning through QR code scanning
- Business reward creation and redemption validation
- Influencer affiliate marketing with commission tracking
- Local business discovery
- QR-based loyalty system
- Multi-role user authentication

### Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Storage, Realtime)
- **Storage**: Vercel Blob for profile images, Supabase Storage for offer images
- **Authentication**: Supabase Auth with email/password and Google OAuth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel

## User Roles and Features

### 1. Customer
- Dashboard with points balance and transaction history
- Personal QR code for earning points at businesses
- Browse and redeem rewards from businesses
- Discover local businesses
- Affiliate referral tracking
- Profile management with image upload

### 2. Business
- Dashboard with revenue statistics and transaction history
- QR scanner to award points to customers
- Create and manage rewards for customers
- Validate customer reward redemptions
- Configure points earning rates
- Business profile management with image upload
- Offer creation (discounts and exclusive offers)

### 3. Influencer
- Dashboard with affiliate marketing performance
- Generate unique affiliate links for businesses
- Track conversions and earnings
- Commission tracking from referrals and customer transactions
- Profile management with image upload

## Technical Architecture

### Frontend Structure
The application follows a standard Next.js 15 App Router structure:
```
app/
├── auth/              # Authentication pages
├── dashboard/         # Role-specific dashboards
├── business/[id]/     # Business public pages
└── test/              # Testing components
```

### Component Architecture
- **UI Components**: Reusable UI components in `components/ui/`
- **Layout Components**: Dashboard layouts and navigation
- **Feature Components**: Role-specific components
- **Landing Page Blocks**: Pro blocks for the marketing site

### State Management
- React hooks for local component state
- Supabase client for backend data fetching
- Custom hooks for complex data fetching logic

### Styling
- Tailwind CSS for styling
- Custom CSS variables for consistent design
- Responsive design for all device sizes

## Database Schema

### Core Tables
1. **profiles**: User profiles with roles
2. **customers**: Customer-specific information
3. **businesses**: Business-specific information
4. **influencers**: Influencer-specific information

### Loyalty System Tables
1. **points_transactions**: Records of customer spending and points earned
2. **rewards**: Business-created rewards for customers
3. **redemptions**: Records of customer reward redemptions

### Affiliate System Tables
1. **affiliate_links**: Links created by influencers for businesses
2. **affiliate_conversions**: Records of successful referrals

### Offer System Tables
1. **discount_offers**: Business-created discount offers
2. **discount_usage**: Records of discount offer redemptions
3. **exclusive_offers**: Business-created exclusive offers
4. **exclusive_offer_usage**: Records of exclusive offer redemptions

### Storage Tables
1. **user_media**: Metadata for user-uploaded media files

### Row Level Security (RLS)
All tables implement RLS policies to ensure data isolation between users:
- Customers can only view their own data
- Businesses can only view their own data
- Influencers can only view their own data
- Proper relationships are enforced through foreign key constraints

## Authentication System

### Authentication Flow Updates

### Consolidated Signup Process
- All signup processes are now consolidated on a single page: `/auth/signup`
- Users first choose their role (customer, business, or influencer)
- After selecting a role, they can either:
  1. Sign up with email and password
  2. Continue with Google (after filling required fields)
- Removed the separate role selection page

### Google Authentication Improvements
- Google signup now requires users to fill in required fields before proceeding
- Form data is stored in both localStorage and cookies to ensure access in both client and server contexts
- Google sign-in on login page only works for existing users
- New users are prompted to sign up instead

### Redirect Fixes
- Fixed OAuth callback to redirect users to their role-specific setup wizard after Google signup
- Removed references to deleted role-selection page
- Proper cookie management for form data persistence

### Removed Pages
- `/auth/role-selection` - No longer needed with consolidated signup flow

### Updated Flow
1. User visits `/auth/signup`
2. User selects their role
3. User fills in required fields for their role
4. User can either:
   - Sign up with email/password
   - Continue with Google (validates fields first)
5. After authentication, user is redirected to role-specific setup wizard
6. After setup, user is redirected to their dashboard

### Authentication Flow
1. Users sign up or log in through Supabase Auth
2. Middleware checks user authentication status
3. Authenticated users are directed to their role-specific dashboard
4. Unauthenticated users are redirected to login (except for public routes)

### Supported Authentication Methods
1. **Email/Password**: Traditional signup and login
2. **Google OAuth**: Single sign-on with Google accounts
3. **Role Selection**: Wizard for new users to select their account type

### Session Management
- Automatic session refresh through Supabase middleware
- Proper cookie handling for SSR and client-side components
- Secure token storage and rotation

### Account Linking
- Automatic linking of Google accounts with existing email accounts
- Role-based routing after authentication
- Profile setup wizards for new users

## Affiliate System

### System Overview
The affiliate system allows influencers to earn commissions by promoting businesses:
1. Influencers generate unique affiliate links for businesses
2. When customers sign up through these links, conversions are tracked
3. Influencers earn points for successful referrals and customer transactions

### Key Features
- **Link Generation**: Influencers can create unique referral links
- **Conversion Tracking**: Automatic tracking of successful signups
- **Commission System**: Points awarded for referrals and transactions
- **Dashboard Analytics**: Performance metrics and earnings tracking

### Implementation Details
- Unique codes generated for each affiliate link
- Database triggers to automatically award points
- Conversion records with detailed metadata
- Points tracking for both initial referrals and ongoing transactions

## Loyalty Program Features

### Points System
- Configurable points earning rates per business
- Automatic point calculation based on spending
- Point redemption for rewards
- Transaction history tracking

### Rewards System
- Businesses can create custom rewards
- Customers can browse and redeem rewards
- Business validation of reward redemptions
- Reward images and descriptions

### Redemption Flow
1. Customer requests reward redemption
2. Business validates the redemption
3. Points are deducted from customer account
4. Redemption record is created

## Image Storage System

### Storage Strategy
- **Profile Images**: Vercel Blob storage
- **Offer/Reward Images**: Supabase Storage buckets
- **Media Gallery**: Vercel Blob for business media

### Implementation Details
- Secure token handling through server-side API routes
- Automatic file naming and organization
- Public URL generation for image display
- Proper error handling and cleanup

### Components
- **ProfileImageUpload**: For user profile pictures
- **OfferImageUpload**: For business offer images
- **MediaGallery**: For business media collections

## QR Code Implementation

### Customer QR Codes
- Unique QR codes generated for each customer
- Contains customer identification data
- Scanned by businesses to award points
- Secure and tamper-resistant

### Business Scanning
- Real-time QR code scanning
- Instant point awarding
- Transaction recording
- Error handling for invalid codes

### Redemption QR Codes
- Generated for reward redemptions
- Contains redemption identification data
- Scanned by businesses for validation
- Secure validation process

## Offer Systems

### Discount Offers
- Percentage or fixed amount discounts
- Usage tracking and limits
- Expiration dates
- Business-specific availability

### Exclusive Offers
- Special offers for loyal customers
- Tiered access based on points
- Limited availability
- Enhanced tracking

### Offer Redemption Flow
1. Customer selects offer to redeem
2. System generates unique QR code
3. Business scans QR code to validate offer
4. Offer usage is recorded
5. Customer receives benefit

## Deployment Guide

### Prerequisites
- Supabase project with proper configuration
- Vercel account for deployment
- Vercel Blob account for image storage
- Google OAuth credentials (optional)

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
```

### Database Setup
1. Run SQL scripts in order from `scripts/` directory
2. Enable Row Level Security on all tables
3. Set up storage buckets for images
4. Configure authentication providers

### Deployment Steps
1. Push code to GitHub
2. Connect Vercel to GitHub repository
3. Set environment variables in Vercel dashboard
4. Deploy and monitor for errors

## Troubleshooting

### Common Issues
1. **Authentication Problems**: Check session cookies and token expiration
2. **Database Access**: Verify RLS policies and user roles
3. **Image Uploads**: Ensure proper token configuration and file permissions
4. **QR Scanning**: Check camera permissions and lighting conditions

### Debugging Tools
- Supabase dashboard for database queries
- Browser developer tools for frontend debugging
- Vercel logs for deployment issues
- Custom logging in application code

### Performance Optimization
- Database indexing for frequently queried columns
- Caching strategies for static data
- Image optimization and compression
- Lazy loading for non-critical components

---

*This documentation was consolidated from multiple individual documentation files to provide a comprehensive overview of the Giya application development.*