# Giya App - Hyperlocal Discovery & Privilege Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/team-ocss-projects/v0-mind-space-saa-s-landing-page-t)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/xnxjpFAnlr0)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-%2300C4CC?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

## Overview

Giya is a hyperlocal discovery and privilege app that unlocks new experiences and perks for locals. The platform connects three key user types:

- **Customers**: Earn points by shopping at participating businesses
- **Businesses**: Reward loyal customers with points-based loyalty programs
- **Influencers**: Promote businesses and earn rewards through affiliate marketing

## Project Structure

```
giya/
├── app/                 # Next.js app router pages
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Role-based dashboards
│   └── ...             # Other pages
├── components/         # Reusable UI components
├── lib/                # Utility functions and Supabase clients
├── scripts/            # Database schema and setup scripts
└── styles/             # Global styles
```

## Setup Instructions

### Prerequisites

1. Node.js 18+
2. pnpm package manager
3. Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd giya
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up Supabase database:
   Run the SQL scripts in the [scripts/](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts) directory in numerical order in your Supabase SQL editor.

### Development

Start the development server:
```bash
pnpm dev
```

The app will be available at http://localhost:3000

## Customization Guide

### UI/UX Modifications

1. **Component Structure**: Components are organized in the [components/](file:///c%3A/Users/User/OneDrive/Desktop/giya/components) directory
2. **UI Components**: Use Shadcn UI components from [components/ui/](file:///c%3A/Users/User/OneDrive/Desktop/giya/components/ui)
3. **Styling**: Modify Tailwind classes directly in components
4. **Global Styles**: Edit [app/globals.css](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/globals.css) for global styling changes

### Feature Modifications

1. **Add New Pages**: Create new directories in [app/](file:///c%3A/Users/User/OneDrive/Desktop/giya/app) with page.tsx files
2. **Modify User Flows**: Edit dashboard pages in [app/dashboard/](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/dashboard)
3. **Database Changes**: Update SQL scripts in [scripts/](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts) directory
4. **API Integration**: Use Supabase client from [lib/supabase/](file:///c%3A/Users/User/OneDrive/Desktop/giya/lib/supabase)

## Deployment

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
     - Build Command: `pnpm build`
     - Output Directory: `.next`
   - Add environment variables in Vercel project settings

4. **Domain Configuration** (Optional):
   - Add custom domain in Vercel dashboard
   - Configure DNS records as instructed by Vercel

## Additional Documentation

For detailed technical documentation, see [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Support

For support, contact the development team or refer to the documentation in [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md).
