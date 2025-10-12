# Giya Hooks

This document provides an overview of the custom hooks in the Giya application.

## useDashboardData

A custom hook that abstracts common data fetching patterns for dashboard pages.

### Usage

```tsx
import { useDashboardData } from '@/hooks/use-dashboard-data';

const { data, isLoading, error } = useDashboardData({ userType: 'customer' });
```

### Parameters

- `userType`: Type of user ('customer', 'business', or 'influencer')

### Returns

- `data`: Dashboard data including user information, transactions, redemptions, etc.
- `isLoading`: Boolean indicating if data is being loaded
- `error`: Error message if data fetching failed
- `refetch`: Function to manually refetch data

### Data Structure

The hook returns different data based on the user type:

#### Customer Data
- `customer`: Customer information
- `transactions`: Recent transactions
- `redemptions`: Recent redemptions
- `businessPoints`: Points per business

#### Business Data
- `business`: Business information
- `transactions`: Recent transactions
- `stats`: Business statistics (total transactions, revenue, unique customers)

#### Influencer Data
- `influencer`: Influencer information
- `businesses`: All businesses
- `affiliateLinks`: Generated affiliate links
- `conversions`: Conversion history

### Example

```tsx
import { useDashboardData } from '@/hooks/use-dashboard-data';

export default function CustomerDashboard() {
  const { data, isLoading, error } = useDashboardData({ userType: 'customer' });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data?.customer) return <div>No customer data</div>;

  return (
    <div>
      <h1>Welcome, {data.customer.full_name}!</h1>
      {/* Render dashboard content */}
    </div>
  );
}
```