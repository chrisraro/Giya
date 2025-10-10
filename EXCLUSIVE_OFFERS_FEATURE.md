# Exclusive Offers Feature Documentation

## Overview
This feature allows business users to create and manage exclusive offers for specific products or items from their business. Customers can browse and view these exclusive offers.

## Key Features

### For Business Users
1. **Create Exclusive Offers** - Businesses can create offers for specific products/items:
   - Set original and discounted prices
   - Add product descriptions and images
   - Set usage limits and validity periods
2. **Manage Offers** - Businesses can:
   - Edit existing offers
   - Activate/deactivate offers
   - Track usage statistics
   - Set validity periods
3. **Track Usage** - Businesses can see how many times each offer has been viewed

### For Customers
1. **View Exclusive Offers** - Customers can see all active exclusive offers from businesses
2. **Product Focus** - Offers are focused on specific products/items rather than general discounts

## Database Schema

### exclusive_offers Table
```sql
create table if not exists public.exclusive_offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text not null,
  description text,
  product_name text not null,
  original_price numeric(10, 2),
  discounted_price numeric(10, 2),
  discount_percentage numeric(5, 2),
  image_url text,
  is_active boolean default true,
  usage_limit integer, -- maximum number of times this offer can be used (-1 for unlimited)
  used_count integer default 0, -- current number of times this offer has been used
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### exclusive_offer_usage Table
```sql
create table if not exists public.exclusive_offer_usage (
  id uuid primary key default gen_random_uuid(),
  exclusive_offer_id uuid references public.exclusive_offers(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  used_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);
```

## Implementation Details

### UI Components

#### Business Dashboard
- New "Exclusive Offers" section in navigation
- "Manage Exclusive Offers" button on the main dashboard
- Exclusive offer management page with CRUD operations

#### Customer Dashboard
- "View Exclusive Offers" button in quick actions
- Exclusive offers browsing page showing all available offers

## Database Functions

### increment_exclusive_offer_usage(exclusive_offer_id)
A PostgreSQL function that increments the used_count for an exclusive offer.

## Setup Instructions

1. Run the database scripts:
   - `026_create_exclusive_offers_table.sql`
   - `027_create_exclusive_offer_usage_table.sql`
   - `028_create_increment_exclusive_offer_usage_function.sql`

2. Business users can manage their exclusive offers through the dashboard at `/dashboard/business/exclusive-offers`

3. Customers can view available exclusive offers at `/dashboard/customer/exclusive-offers`

## Future Enhancements

1. Add expiration notifications for customers
2. Implement offer categories
3. Add offer sharing functionality
4. Create analytics dashboard for business users to track offer performance