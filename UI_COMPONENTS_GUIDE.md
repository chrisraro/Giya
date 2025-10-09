# UI Components Guide

This guide explains how to use the new UI components added to enhance the Giya loyalty platform.

## 1. Breadcrumbs

Breadcrumbs provide a navigation trail for users to track their location within the application.

### Usage:

```tsx
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem isCurrent>
      Profile
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Props:
- `isCurrent`: Marks the current page in the breadcrumb trail
- `href`: Navigation link for breadcrumb items

## 2. Snackbar

Snackbar provides brief messages about app processes with optional action buttons and undo functionality.

### Usage:

```tsx
import { Snackbar } from "@/components/ui/snackbar"
import { Button } from "@/components/ui/button"

const [snackbarOpen, setSnackbarOpen] = useState(false)
const [snackbarMessage, setSnackbarMessage] = useState("")
const [snackbarAction, setSnackbarAction] = useState<React.ReactNode>(null)
const [snackbarOnAction, setSnackbarOnAction] = useState<(() => void) | null>(null)

<Snackbar
  open={snackbarOpen}
  onOpenChange={setSnackbarOpen}
  action={snackbarAction}
  onAction={snackbarOnAction}
  duration={5000}
  variant="success"
  position="bottom-right"
>
  {snackbarMessage}
</Snackbar>
```

### Props:
- `open`: Controls visibility of the snackbar
- `onOpenChange`: Callback when snackbar visibility changes
- `action`: Optional action button text
- `onAction`: Callback for action button click
- `duration`: Auto-dismiss time in milliseconds (default: 5000)
- `variant`: Style variant (default, destructive, success, warning)
- `position`: Position on screen (top-left, top-right, bottom-left, bottom-right, top-center, bottom-center)
- `showCloseButton`: Whether to show close button (default: true)

## 3. Chips

Chips are compact elements that represent inputs, attributes, or actions.

### Usage:

```tsx
import { Chip } from "@/components/ui/chip"

<Chip variant="default">All Rewards</Chip>
<Chip variant="outline">Food & Dining</Chip>
<Chip 
  variant="default" 
  closable 
  onClose={() => console.log("Chip closed")}
>
  Selected Category
</Chip>
```

### Props:
- `variant`: Style variant (default, secondary, destructive, outline, success, warning, info)
- `closable`: Whether the chip can be closed
- `onClose`: Callback when chip is closed

## 4. Skeleton Loading

Skeleton loading provides a placeholder preview of content while it's loading.

### Usage:

```tsx
import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-4 w-32" />
<Skeleton className="h-10 w-10 rounded-full" />
<Skeleton className="h-48 w-48 rounded-lg" />
```

### Props:
- Standard HTML div attributes
- `className`: Tailwind classes for styling

## 5. Enhanced Tabs

Tabs have been improved with better styling and transitions.

### Usage:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="transactions" className="w-full">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="transactions">Transaction History</TabsTrigger>
    <TabsTrigger value="redemptions">Redemption History</TabsTrigger>
  </TabsList>
  <TabsContent value="transactions">
    {/* Content for transactions tab */}
  </TabsContent>
  <TabsContent value="redemptions">
    {/* Content for redemptions tab */}
  </TabsContent>
</Tabs>
```

## Implementation Examples

The new components have been implemented in:
- Customer Dashboard (`app/dashboard/customer/page.tsx`)
- Customer Rewards (`app/dashboard/customer/rewards/page.tsx`)
- Business Dashboard (`app/dashboard/business/page.tsx`)

These implementations demonstrate:
- Breadcrumbs for navigation
- Skeleton loading for better perceived performance
- Snackbar with undo functionality
- Category filters using chips
- Enhanced tab styling

## Best Practices

1. **Use breadcrumbs** on all pages that are 2+ levels deep
2. **Implement skeleton loading** for all data-fetching components
3. **Use snackbars** for temporary messages with optional actions
4. **Apply chips** for category filters and tags
5. **Enhance tabs** for better user experience in content switching

## Customization

All components can be customized through Tailwind classes passed via the `className` prop. The components follow the existing design system and theme variables.