# Giya App - Project Documentation

## Project Overview

Giya is a hyperlocal discovery and privilege app that unlocks new experiences and perks for locals. The app connects three types of users:
- **Customers**: Earn points by shopping at participating businesses
- **Businesses**: Reward loyal customers with points-based loyalty programs
- **Influencers**: Promote businesses and earn rewards through affiliate marketing

The app is built with Next.js 15, TypeScript, Tailwind CSS, and uses Supabase as the backend database with authentication.

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Shadcn UI
- **State Management**: React Context API
- **Icons**: Lucide React
- **QR Code**: jsQR for scanning, qrcode.react for generation

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Real-time features

### Deployment
- **Hosting**: Vercel
- **Package Manager**: pnpm

## Project Structure

```
giya/
├── app/                 # Next.js app router pages
│   ├── auth/           # Authentication pages (login, signup, verify-email)
│   ├── dashboard/      # Role-based dashboards (customer, business, influencer)
│   └── ...             # Other pages
├── components/         # Reusable UI components
├── lib/                # Utility functions and Supabase clients
├── scripts/            # Database schema and setup scripts
└── styles/             # Global styles
```

## User Roles and Features

### 1. Customer
- **Dashboard**: View points balance, transaction history, and redemption history
- **QR Code**: Personal QR code for earning points at businesses
- **Rewards**: Browse and redeem rewards from businesses
- **Points System**: Earn points based on spending at participating businesses

### 2. Business
- **Dashboard**: View revenue statistics, transaction history
- **QR Scanner**: Scan customer QR codes to award points
- **Rewards Management**: Create and manage rewards for customers
- **Redemption Validation**: Validate customer reward redemptions
- **Points Configuration**: Set how many points customers earn per peso spent

### 3. Influencer
- **Dashboard**: View affiliate marketing performance
- **Affiliate Links**: Generate unique links to promote businesses
- **Commission Tracking**: Track earnings from successful referrals

## Database Schema

The database consists of several tables:

1. **profiles**: Core user profiles with roles
2. **customers**: Customer-specific information
3. **businesses**: Business-specific information
4. **influencers**: Influencer-specific information
5. **points_transactions**: Records of customer spending and points earned
6. **rewards**: Business-created rewards for customers
7. **redemptions**: Records of customer reward redemptions
8. **affiliate_links**: Links created by influencers for businesses
9. **affiliate_conversions**: Records of successful referrals

## Configuration Files

### Environment Variables
The app requires the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

### Next.js Configuration (`next.config.mjs`)
- ESLint and TypeScript errors are ignored during builds
- Images are not optimized (unoptimized: true)

### TypeScript Configuration (`tsconfig.json`)
- Strict type checking enabled
- ES6 target
- Path aliases configured (@/* maps to ./*)

## Authentication Flow

1. Users sign up or log in through Supabase Auth
2. Middleware checks user authentication status
3. Unauthenticated users are redirected to login (except for public routes)
4. Authenticated users are directed to their role-specific dashboard

## How to Modify Features

### UI/UX Design Changes
1. **Component Structure**: Components are organized in the [components/](file:///c%3A/Users/User/OneDrive/Desktop/giya/components) directory
2. **UI Components**: Use Shadcn UI components from [components/ui/](file:///c%3A/Users/User/OneDrive/Desktop/giya/components/ui)
3. **Styling**: Modify Tailwind classes directly in components
4. **Global Styles**: Edit [app/globals.css](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/globals.css) for global styling changes

### Feature Modifications
1. **Add New Pages**: Create new directories in [app/](file:///c%3A/Users/User/OneDrive/Desktop/giya/app) with page.tsx files
2. **Modify User Flows**: Edit dashboard pages in [app/dashboard/](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/dashboard)
3. **Database Changes**: Update SQL scripts in [scripts/](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts) directory
4. **API Integration**: Use Supabase client from [lib/supabase/](file:///c%3A/Users/User/OneDrive/Desktop/giya/lib/supabase)

## Backend Setup Status

✅ **Properly Configured**:
- Supabase authentication is properly integrated
- Database schema is defined with all necessary tables
- Row Level Security (RLS) policies are implemented
- User roles and permissions are configured

## Row Level Security Policies

The application implements comprehensive Row Level Security policies to ensure data isolation and security:

1. **Core Tables**: All core tables (profiles, customers, businesses, influencers, points_transactions, rewards, redemptions, affiliate_links, affiliate_conversions) have RLS policies configured
2. **Discount Offers Tables**: New RLS policies for discount_offers and discount_usage tables (see [RLS_POLICIES_FOR_NEW_TABLES.md](file:///c%3A/Users/User/OneDrive/Desktop/giya/RLS_POLICIES_FOR_NEW_TABLES.md))
3. **Exclusive Offers Tables**: New RLS policies for exclusive_offers and exclusive_offer_usage tables (see [RLS_POLICIES_FOR_NEW_TABLES.md](file:///c%3A/Users/User/OneDrive/Desktop/giya/RLS_POLICIES_FOR_NEW_TABLES.md))

For detailed information about the RLS policies for the new tables, see [RLS_POLICIES_FOR_NEW_TABLES.md](file:///c%3A/Users/User/OneDrive/Desktop/giya/RLS_POLICIES_FOR_NEW_TABLES.md).

## QR Code Implementation

The application implements QR code functionality for multiple use cases:

1. **Customer Points**: Customers have personal QR codes for earning points
2. **Reward Redemptions**: Customers generate QR codes when redeeming rewards
3. **Discount Offers**: Businesses and customers use QR codes for discount offers
4. **Exclusive Offers**: Businesses and customers use QR codes for exclusive offers

For detailed information about the QR code implementation, see [QR_CODE_IMPLEMENTATION_SUMMARY.md](file:///c%3A/Users/User/OneDrive/Desktop/giya/QR_CODE_IMPLEMENTATION_SUMMARY.md).

## Deployment to Production

### Current Deployment
The project is currently deployed on Vercel and integrated with v0.app for automatic syncing.

### Steps to Deploy Safely
1. **Environment Setup**:
   - Ensure Supabase project is created
   - Set environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Database Setup**:
   - Run SQL scripts in [scripts/](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts) directory in order:
     - [001_create_tables.sql](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/001_create_tables.sql)
     - [002_enable_rls.sql](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/002_enable_rls.sql)
     - Other scripts as needed

3. **Vercel Deployment**:
   - Connect GitHub repository to Vercel
   - Configure build settings:
     - Build Command: `next build`
     - Output Directory: `.next`
   - Add environment variables in Vercel project settings

4. **Domain Configuration** (Optional):
   - Add custom domain in Vercel dashboard
   - Configure DNS records as instructed by Vercel

### Production Best Practices
- Enable Supabase email confirmations for better security
- Set up proper error monitoring (e.g., Sentry)
- Configure analytics (already integrated with Vercel Analytics)
- Set up proper backup strategies for Supabase database
- Implement rate limiting for API endpoints
- Regularly update dependencies to patch security vulnerabilities

## Development Workflow

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Run Development Server**:
   ```bash
   pnpm dev
   ```

3. **Build for Production**:
   ```bash
   pnpm build
   ```

4. **Run Production Server**:
   ```bash
   pnpm start
   ```

## Customization Guide

### Adding New Features
1. Create new components in [components/](file:///c%3A/Users/User/OneDrive/Desktop/giya/components) directory
2. Add new pages in [app/](file:///c%3A/Users/User/OneDrive/Desktop/giya/app) directory
3. Update database schema if needed (add new SQL script)
4. Update navigation in [components/dashboard-nav.tsx](file:///c%3A/Users/User/OneDrive/Desktop/giya/components/dashboard-nav.tsx)

### Modifying User Roles
1. Update the `user_role` enum in database schema
2. Modify authentication flows in [lib/supabase/](file:///c%3A/Users/User/OneDrive/Desktop/giya/lib/supabase) files
3. Add new dashboard pages in [app/dashboard/](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/dashboard)
4. Update navigation in [components/dashboard-nav.tsx](file:///c%3A/Users/User/OneDrive/Desktop/giya/components/dashboard-nav.tsx)

This documentation provides a comprehensive overview of the Giya app, its architecture, and how to modify or extend its functionality.