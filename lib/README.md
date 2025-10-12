# Giya Utility Functions

This document provides an overview of the utility functions in the Giya application.

## Error Handler

### handleApiError

Enhanced error handling utility with user-friendly error messages.

#### Usage

```ts
import { handleApiError } from '@/lib/error-handler';

try {
  // Some operation
} catch (error) {
  handleApiError(error, "Failed to load data", "Dashboard.fetchData");
}
```

#### Parameters

- `error`: Error object
- `userMessage`: User-friendly error message
- `context`: Context where the error occurred (used for logging)

#### Returns

- Formatted error message suitable for display to the user

### handleDatabaseError

Specialized error handler for database operations.

#### Usage

```ts
import { handleDatabaseError } from '@/lib/error-handler';

try {
  // Database operation
} catch (error) {
  handleDatabaseError(error, "create transaction");
}
```

#### Parameters

- `error`: Error object
- `operation`: Description of the operation that failed

## Retry Utilities

### retryWithBackoff

Implements retry mechanisms with exponential backoff for network operations.

#### Usage

```ts
import { retryWithBackoff } from '@/lib/retry-utils';

const result = await retryWithBackoff(async () => {
  // Operation to retry
}, { maxRetries: 3, delay: 1000 });
```

#### Parameters

- `operation`: Async function to retry
- `options`: 
  - `maxRetries`: Maximum number of retry attempts (default: 3)
  - `delay`: Initial delay in milliseconds (default: 1000)
  - `backoffFactor`: Factor by which delay increases after each retry (default: 2)

#### Returns

- Result of the successful operation

#### Example

```ts
import { retryWithBackoff } from '@/lib/retry-utils';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const { data, error } = await retryWithBackoff(
  async () => {
    const result = await supabase
      .from("businesses")
      .select("id, business_name, business_category, profile_pic_url, points_per_currency, address")
      .eq("id", user.id)
      .single();
    if (result.error) throw result.error;
    return result;
  },
  { maxRetries: 3, delay: 1000 }
);
```

## Supabase Utilities

### createClient

Creates a Supabase client instance for client-side operations.

#### Usage

```ts
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
```

### createServerClient

Creates a Supabase client instance for server-side operations.

#### Usage

```ts
import { createServerClient } from '@/lib/supabase/server';

const supabase = createServerClient();
```

### createMiddlewareClient

Creates a Supabase client instance for middleware operations.

#### Usage

```ts
import { createMiddlewareClient } from '@/lib/supabase/middleware';

const supabase = createMiddlewareClient();
```