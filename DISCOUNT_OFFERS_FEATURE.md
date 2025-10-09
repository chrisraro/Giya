# Discount Offers Feature Documentation

## Overview
This feature allows business users to create and manage discount offers that customers can avail of. It includes a default first visit discount that is automatically created during business setup.

## Key Features

### For Business Users
1. **Create Discount Offers** - Businesses can create various types of discounts:
   - Percentage discounts (e.g., 10% off)
   - Fixed amount discounts (e.g., ₱50 off)
   - First visit only discounts
2. **Manage Offers** - Businesses can:
   - Edit existing offers
   - Activate/deactivate offers
   - Set usage limits
   - Set validity periods
   - Configure minimum purchase requirements
3. **Track Usage** - Businesses can see how many times each offer has been used

### For Customers
1. **View Available Discounts** - Customers can see all active discounts from businesses
2. **Automatic Application** - Discounts are automatically applied when making purchases
3. **First Visit Benefits** - Special discounts for first-time visitors to businesses

## Database Schema

### discount_offers Table
```sql
create table if not exists public.discount_offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text not null,
  description text,
  discount_type text not null, -- 'percentage', 'fixed_amount', 'first_visit'
  discount_value numeric(5, 2) not null, -- percentage (e.g., 10 for 10%) or fixed amount
  minimum_purchase numeric(10, 2), -- minimum purchase required to avail discount
  is_active boolean default true,
  usage_limit integer, -- maximum number of times this offer can be used (-1 for unlimited)
  used_count integer default 0, -- current number of times this offer has been used
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  is_first_visit_only boolean default false, -- whether this offer is only for first-time visitors
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### discount_usage Table
```sql
create table if not exists public.discount_usage (
  id uuid primary key default gen_random_uuid(),
  discount_offer_id uuid references public.discount_offers(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  used_at timestamp with time zone default now(),
  transaction_id uuid references public.points_transactions(id) on delete set null, -- link to transaction if applicable
  created_at timestamp with time zone default now()
);
```

## Implementation Details

### Default First Visit Discount
During business setup, a default "First Visit Discount" (10% off) is automatically created for each business.

### Automatic Discount Application
When a business creates a transaction for a customer:
1. The system checks if the customer is visiting for the first time
2. It finds all applicable active discounts for that business
3. It filters out discounts the customer has already used
4. It applies the best available discount (highest value)
5. It records the discount usage

### Discount Types
1. **Percentage** - A percentage off the total purchase amount
2. **Fixed Amount** - A fixed peso amount off the total purchase
3. **First Visit Only** - Special discounts only for first-time customers

## UI Components

### Business Dashboard
- New "Discounts" section in navigation
- "Manage Discounts" button on the main dashboard
- Discount management page with CRUD operations

### Customer Dashboard
- "View Discounts" button in quick actions
- Discount browsing page showing all available offers

## API Functions

### increment_discount_usage(discount_id)
A PostgreSQL function that increments the used_count for a discount offer.

## Setup Instructions

1. Run the database scripts:
   - `023_create_discount_offers_table.sql`
   - `024_create_discount_usage_table.sql`
   - `025_create_increment_discount_usage_function.sql`

2. The default first visit discount is automatically created during business setup

3. Business users can manage their discounts through the dashboard at `/dashboard/business/discounts`

4. Customers can view available discounts at `/dashboard/customer/discounts`

## Future Enhancements

1. Add expiration notifications for customers
2. Implement discount categories
3. Add discount sharing functionality
4. Create analytics dashboard for business users to track discount performance