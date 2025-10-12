/**
 * Retry utility functions for network operations
 */

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  exponentialBackoff?: boolean;
  maxDelay?: number;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise with the result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    exponentialBackoff = true,
    maxDelay = 10000
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay
      const currentDelay = exponentialBackoff 
        ? Math.min(delay * Math.pow(2, attempt), maxDelay)
        : delay;
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * currentDelay;
      const finalDelay = currentDelay + jitter;
      
      console.warn(`Attempt ${attempt + 1} failed. Retrying in ${finalDelay}ms...`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Check if an error is retryable
 * @param error - The error to check
 * @returns boolean indicating if the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'NetworkError' || 
        error.message.includes('Network Error') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT')) {
      return true;
    }
    
    // HTTP 5xx errors (server errors)
    if (error.message.includes('500') || 
        error.message.includes('502') || 
        error.message.includes('503') || 
        error.message.includes('504')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Retry a function only if the error is retryable
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise with the result of the function
 */
export async function retryIfRetryable<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(async () => {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryableError(error)) {
        throw error;
      }
      throw error;
    }
  }, options);
}