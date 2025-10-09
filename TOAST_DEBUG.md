# Toast Debugging Guide

## How to Test if Toast Notifications Are Working

### Step 1: Test in Browser Console
Open your browser's developer tools and go to the Console tab. Run these commands:

```javascript
// Test if toast is available
console.log('Toast available:', typeof toast !== 'undefined');

// Test a simple toast
if (typeof toast !== 'undefined') {
  toast.success('Test success message');
  toast.error('Test error message');
  toast.info('Test info message');
}

// Test if Supabase is available
console.log('Supabase available:', typeof supabase !== 'undefined');

// Test Supabase auth
if (typeof supabase !== 'undefined') {
  supabase.auth.getUser().then(result => {
    console.log('Auth result:', result);
  });
}
```

### Step 2: Check for JavaScript Errors
Look for any red error messages in the console that might indicate why toast notifications aren't showing.

### Step 3: Check Network Tab
1. Go to the Network tab in developer tools
2. Try to redeem a reward
3. Look for any failed requests (they'll appear in red)
4. Click on failed requests to see details

### Step 4: Manual Toast Test Component
Create a simple test component to verify toast functionality:

```jsx
'use client'

import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function ToastTest() {
  const testToast = () => {
    console.log('Attempting to show toast...');
    toast.success('Test success message');
    toast.error('Test error message');
    console.log('Toast commands executed');
  }

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
      <h3>Toast Test Component</h3>
      <p>Click the button below to test toast notifications:</p>
      <Button onClick={testToast}>Test Toast</Button>
    </div>
  )
}
```

You can add this component to any page to test if toast is working.

### Step 5: Check for Conflicting Libraries
Make sure there are no other toast/notification libraries conflicting with sonner. Check your package.json for:

- react-toastify
- notistack
- Other notification libraries

### Step 6: Check Toast Provider
Some toast libraries require a provider component. For sonner, check if you have the Toaster component in your layout:

```jsx
// In your root layout or page
import { Toaster } from 'sonner'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
```

### Common Issues:
1. **Missing Toaster Component**: Sonner requires the Toaster component to be rendered
2. **Import Issues**: Incorrect import path or name
3. **Version Conflicts**: Multiple versions of sonner or conflicting libraries
4. **CSS Issues**: Missing or conflicting CSS that hides toast notifications
5. **JavaScript Errors**: Uncaught exceptions preventing toast from being called

### What to Look For:
1. Any error messages in the console when trying to show toasts
2. Network errors that might prevent the redemption process from completing
3. Whether the redemption data is actually being inserted into the database
4. If other parts of the app show toast notifications correctly