import { toast } from "sonner"

/**
 * Standardized error handling utility
 * Provides consistent error messages and logging
 */

// Type guard to check if an error has a message property
export function hasErrorMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error
}

// Type guard to check if an error has a details property
export function hasErrorDetails(error: unknown): error is { details: string } {
  return typeof error === 'object' && error !== null && 'details' in error
}

/**
 * Handle API errors consistently
 * @param error - The error object
 * @param defaultMessage - Default message to show if error doesn't have a message
 * @param context - Context for logging (e.g., component name, operation)
 */
export function handleApiError(
  error: unknown, 
  defaultMessage: string, 
  context?: string
): string {
  // Log error with context for debugging
  if (context) {
    console.error(`[Giya Error] ${context}:`, error)
  } else {
    console.error('[Giya Error]:', error)
  }
  
  // Extract message from error object
  let message = defaultMessage
  
  if (hasErrorMessage(error)) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }
  
  // Show toast notification to user
  toast.error(message)
  
  return message
}

/**
 * Handle form validation errors
 * @param error - The error object
 * @param field - The field name for context
 */
export function handleFormError(error: unknown, field?: string): string {
  let message = "Invalid input"
  
  if (field) {
    message = `Invalid ${field}`
  }
  
  if (hasErrorMessage(error)) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }
  
  toast.error(message)
  return message
}

/**
 * Handle authentication errors
 * @param error - The error object
 */
export function handleAuthError(error: unknown): string {
  let message = "Authentication failed"
  
  if (hasErrorMessage(error)) {
    // Map common Supabase auth errors to user-friendly messages
    if (error.message.includes('Invalid login credentials')) {
      message = "Invalid email or password"
    } else if (error.message.includes('User already registered')) {
      message = "An account with this email already exists"
    } else if (error.message.includes('Email not confirmed')) {
      message = "Please verify your email address"
    } else {
      message = error.message
    }
  } else if (typeof error === 'string') {
    message = error
  }
  
  toast.error(message)
  return message
}

/**
 * Handle network errors
 * @param error - The error object
 */
export function handleNetworkError(error: unknown): string {
  let message = "Network error. Please check your connection."
  
  if (hasErrorMessage(error)) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }
  
  toast.error(message)
  return message
}

/**
 * Log information without showing to user
 * @param message - The message to log
 * @param data - Additional data to log
 */
export function logInfo(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.log(`[Giya Info] ${message}:`, data)
  } else {
    console.log(`[Giya Info] ${message}`)
  }
}

/**
 * Log warnings without showing to user
 * @param message - The warning message
 * @param data - Additional data to log
 */
export function logWarning(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.warn(`[Giya Warning] ${message}:`, data)
  } else {
    console.warn(`[Giya Warning] ${message}`)
  }
}