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

### Sign-in Page Updates
- Google sign-in button no longer requires email input first
- Users are redirected directly to Google OAuth
- After Google authentication, the system checks if the user exists in our database
- Existing users are redirected to their dashboard
- New users are redirected to the signup page with a notification

### Redirect Fixes
- Fixed OAuth callback to redirect users to their role-specific setup wizard after Google signup
- Removed references to deleted role-selection page
- Proper cookie management for form data persistence

### Removed Pages
- `/auth/role-selection` - No longer needed with consolidated signup flow

### Updated Flow
1. User visits `/auth/signup` or `/auth/login`
2. On login page, user can either:
   - Sign in with email/password
   - Sign in with Google (redirects directly to Google OAuth)
3. After Google authentication:
   - If user exists in database, redirect to their dashboard
   - If user doesn't exist, redirect to signup page
4. On signup page, user selects their role
5. User fills in required fields for their role
6. User can either:
   - Sign up with email/password
   - Continue with Google (validates fields first)
7. After authentication, user is redirected to role-specific setup wizard
8. After setup, user is redirected to their dashboard

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
2. Customers sign up using these links
3. When customers make purchases, influencers earn commissions
4. Commissions are tracked and paid out based on performance

### Key Components
- **Affiliate Links**: Unique URLs generated by influencers
- **Conversion Tracking**: System that tracks successful referrals
- **Commission Calculation**: Algorithm for determining influencer earnings
- **Performance Dashboard**: Analytics for influencers to track their performance

### Implementation Details
- Links are stored in the `affiliate_links` table with unique codes
- Conversions are tracked in the `affiliate_conversions` table
- Commissions are calculated based on customer transactions
- Real-time updates through Supabase Realtime subscriptions

## Loyalty Program Features

### Points System
- Customers earn points based on business-defined rates (e.g., 1 point per ₱ spent)
- Points can be redeemed for rewards created by businesses
- Transaction history is maintained for transparency

### Rewards System
- Businesses create rewards with point requirements
- Customers browse and redeem rewards
- Businesses validate redemptions through QR code scanning

### QR Code Implementation
- Customers have unique QR codes for identification
- Businesses scan customer QR codes to award points
- Rewards generate QR codes for redemption validation

### Offer Systems

#### Discount Offers
- Percentage or fixed amount discounts
- Usage limits and expiration dates
- First-visit-only options for new customers

#### Exclusive Offers
- Special deals on specific products or services
- Product-specific pricing and discounts
- Limited availability and usage tracking

## Image Storage System

### Storage Solutions
- **Vercel Blob**: Used for profile images (customers, businesses, influencers)
- **Supabase Storage**: Used for offer/reward images

### Implementation Details
- Profile images use the `ProfileImageUpload` component with Vercel Blob
- Offer images use the `OfferImageUpload` component with Supabase Storage
- Proper error handling and loading states for all image operations
- Image optimization and compression for performance

### Security
- RLS policies ensure users can only access their own images
- Signed URLs for secure image delivery
- Proper cleanup of unused images

## Deployment Guide

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account
- Google OAuth credentials
- Environment variables properly configured

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Deployment Steps
1. Set up Supabase project and run database migrations
2. Configure authentication providers
3. Set up storage buckets
4. Configure environment variables in Vercel
5. Deploy the application
6. Test all functionality

## Troubleshooting

### Common Issues
- **Authentication Problems**: Check Supabase auth configuration and environment variables
- **Database Connection**: Verify Supabase URL and keys
- **Image Upload Failures**: Check storage bucket permissions and tokens
- **RLS Policy Errors**: Review database policies and user roles

### Performance Optimization
- Image optimization and compression
- Lazy loading for non-critical components

---

*This documentation was consolidated from multiple individual documentation files to provide a comprehensive overview of the Giya application development.*

## Recent Bug Fixes

### AvatarImage Component Error Fix
- Fixed an issue where `AvatarImage` was being used without being wrapped in an `Avatar` component in the business directory page
- This was causing a runtime error in production: `Uncaught Error: AvatarImage must be used within Avatar`
- The fix ensures all `AvatarImage` components are properly wrapped in `Avatar` components
- Similar issues were checked across the codebase and no other instances were found

### Business Discovery Section Improvements
- Implemented chip components to display business statistics in three key locations:
  1. Landing page business discovery section
  2. Customer dashboard business discovery section
  3. Business directory page
- Added chips showing:
  - Number of rewards with Gift icon
  - Number of exclusive offers with Star icon
  - Maximum discount percentage with Percent icon
- Updated points display to show "1 point per ₱(value)" format for better clarity
- Removed chip implementation from business profile page (not requested)
- Improved overall card layout consistency across all discovery sections