# Giya Component Library

This document provides an overview of the reusable components in the Giya application.

## Dashboard Components

### BusinessPointsCard
A memoized component that displays business points information.

**Props:**
- `business`: Object containing business information including id, name, profile picture URL, total points, and available rewards

**Usage:**
```tsx
import { BusinessPointsCard } from '@/components/dashboard/business-points-card';

<BusinessPointsCard business={businessData} />
```

### BusinessStats
Displays business statistics including total revenue, transactions, and unique customers.

**Props:**
- `totalRevenue`: Number representing total revenue
- `totalTransactions`: Number of total transactions
- `uniqueCustomers`: Number of unique customers

**Usage:**
```tsx
import { BusinessStats } from '@/components/dashboard/business-stats';

<BusinessStats 
  totalRevenue={stats.totalRevenue}
  totalTransactions={stats.totalTransactions}
  uniqueCustomers={stats.uniqueCustomers}
/>
```

### CustomerStats
Displays customer statistics including total points, transactions, and redemptions.

**Props:**
- `totalPoints`: Number of total points
- `totalTransactions`: Number of total transactions
- `totalRedemptions`: Number of total redemptions

**Usage:**
```tsx
import { CustomerStats } from '@/components/dashboard/customer-stats';

<CustomerStats 
  totalPoints={customer.total_points}
  totalTransactions={transactions.length}
  totalRedemptions={redemptions.length}
/>
```

### DiscoverBusinesses
Displays a list of businesses for discovery.

**Props:**
- `businessDiscovery`: Array of business objects

**Usage:**
```tsx
import { DiscoverBusinesses } from '@/components/dashboard/discover-businesses';

<DiscoverBusinesses businessDiscovery={businesses} />
```

### QrCodeCard
Displays a customer's QR code.

**Props:**
- `qrCodeData`: String containing the QR code data

**Usage:**
```tsx
import { QrCodeCard } from '@/components/dashboard/qr-code-card';

<QrCodeCard qrCodeData={customer.qr_code_data} />
```

### QuickActions
Displays quick action buttons for customers.

**Props:**
- `onShowQRDialog`: Function to show the QR dialog

**Usage:**
```tsx
import { QuickActions } from '@/components/dashboard/quick-actions';

<QuickActions onShowQRDialog={() => setShowQRDialog(true)} />
```

### BusinessPointsSection
Displays a section for business points with multiple BusinessPointsCard components.

**Props:**
- `businessPoints`: Array of business points objects

**Usage:**
```tsx
import { BusinessPointsSection } from '@/components/dashboard/business-points-section';

<BusinessPointsSection businessPoints={businessPoints} />
```

### CustomerTransactionHistory
Displays customer transaction and redemption history.

**Props:**
- `transactions`: Array of transaction objects
- `redemptions`: Array of redemption objects

**Usage:**
```tsx
import { CustomerTransactionHistory } from '@/components/dashboard/customer-transaction-history';

<CustomerTransactionHistory 
  transactions={transactions} 
  redemptions={redemptions} 
/>
```

### QrScannerSection
Displays a section with QR scanner functionality for businesses.

**Props:**
- `pointsPerCurrency`: Number of points per currency unit
- `onOpenScanner`: Function to open the QR scanner

**Usage:**
```tsx
import { QrScannerSection } from '@/components/dashboard/qr-scanner-section';

<QrScannerSection 
  pointsPerCurrency={business.points_per_currency}
  onOpenScanner={() => setShowScanner(true)}
/>
```

### TransactionHistory
Displays business transaction history.

**Props:**
- `transactions`: Array of transaction objects

**Usage:**
```tsx
import { TransactionHistory } from '@/components/dashboard/transaction-history';

<TransactionHistory transactions={transactions} />
```

## Layout Components

### DashboardLayout
A shared layout component for all dashboard pages.

**Props:**
- `userRole`: Role of the user ('customer', 'business', or 'influencer')
- `userName`: Name of the user
- `userEmail`: Email or identifier of the user
- `userAvatar`: URL of the user's avatar
- `breadcrumbs`: Array of breadcrumb objects
- `children`: Child components

**Usage:**
```tsx
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

<DashboardLayout
  userRole="customer"
  userName={customer.full_name}
  userEmail={customer.nickname ? `@${customer.nickname}` : undefined}
  userAvatar={customer.profile_pic_url}
  breadcrumbs={[{ label: "Dashboard" }]}
>
  {/* Dashboard content */}
</DashboardLayout>
```

## Utility Components

### OptimizedImage
An optimized image component that handles loading and error states.

**Props:**
- `src`: Source URL of the image
- `alt`: Alternative text for the image
- `width`: Width of the image
- `height`: Height of the image
- `className`: Additional CSS classes
- `priority`: Whether to prioritize loading

**Usage:**
```tsx
import { OptimizedImage } from '@/components/optimized-image';

<OptimizedImage 
  src={business.profile_pic_url} 
  alt={business.business_name} 
  width={48} 
  height={48}
  className="rounded-full"
/>
```

## Hooks

### useDashboardData
A custom hook that abstracts common data fetching patterns for dashboard pages.

**Parameters:**
- `userType`: Type of user ('customer', 'business', or 'influencer')

**Returns:**
- `data`: Dashboard data
- `isLoading`: Loading state
- `error`: Error message
- `refetch`: Function to refetch data

**Usage:**
```tsx
import { useDashboardData } from '@/hooks/use-dashboard-data';

const { data, isLoading, error } = useDashboardData({ userType: 'customer' });
```

## Utility Functions

### retryWithBackoff
Implements retry mechanisms with exponential backoff for network operations.

**Parameters:**
- `operation`: Function to retry
- `options`: Retry options including maxRetries and delay

**Usage:**
```tsx
import { retryWithBackoff } from '@/lib/retry-utils';

const result = await retryWithBackoff(async () => {
  // Operation to retry
}, { maxRetries: 3, delay: 1000 });
```

### handleApiError
Enhanced error handling utility with user-friendly error messages.

**Parameters:**
- `error`: Error object
- `userMessage`: User-friendly error message
- `context`: Context where the error occurred

**Usage:**
```tsx
import { handleApiError } from '@/lib/error-handler';

try {
  // Some operation
} catch (error) {
  handleApiError(error, "Failed to load data", "Dashboard.fetchData");
}
```