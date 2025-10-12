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
 * @param action - Suggested action for the user
 */
export function handleApiError(
  error: unknown, 
  defaultMessage: string, 
  context?: string,
  action?: string
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
  
  // Enhance message with action if provided
  if (action) {
    message = `${message} ${action}`
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
  
  // Make the message more actionable
  message = `${message}. Please check your input and try again.`
  
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
      message = "Invalid email or password. Please check your credentials and try again."
    } else if (error.message.includes('User already registered')) {
      message = "An account with this email already exists. Please try logging in instead."
    } else if (error.message.includes('Email not confirmed')) {
      message = "Please verify your email address. Check your inbox for a confirmation email."
    } else if (error.message.includes('Network error')) {
      message = "Network connection failed. Please check your internet connection and try again."
    } else {
      message = `${error.message}. Please try again or contact support if the issue persists.`
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
  let message = "Network error. Please check your connection and try again."
  
  if (hasErrorMessage(error)) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }
  
  // Add more specific guidance
  message = `${message} If the problem persists, please try again later.`
  
  toast.error(message)
  return message
}

/**
 * Handle database errors
 * @param error - The error object
 * @param operation - The operation that failed
 */
export function handleDatabaseError(error: unknown, operation: string): string {
  let message = `Failed to ${operation}. Please try again.`
  
  if (hasErrorMessage(error)) {
    message = `Failed to ${operation}: ${error.message}`
  } else if (typeof error === 'string') {
    message = `Failed to ${operation}: ${error}`
  }
  
  // Add user-friendly guidance
  message = `${message} If the problem persists, please contact support.`
  
  toast.error(message)
  console.error(`[Giya Database Error] ${operation}:`, error)
  
  return message
}

/**
 * Handle QR code scanning errors
 * @param error - The error object
 */
export function handleQrScanError(error: unknown): string {
  let message = "Failed to scan QR code. Please try again."
  
  if (hasErrorMessage(error)) {
    if (error.message.includes('Permission denied')) {
      message = "Camera access denied. Please allow camera access in your browser settings and try again."
    } else if (error.message.includes('NotFoundError') || error.message.includes('OverconstrainedError')) {
      message = "No camera found or camera not supported. Please check your device and try again."
    } else {
      message = `QR scanning failed: ${error.message}`
    }
  } else if (typeof error === 'string') {
    message = `QR scanning failed: ${error}`
  }
  
  // Add actionable guidance
  message = `${message} Make sure the QR code is visible and well-lit.`
  
  toast.error(message)
  console.error('[Giya QR Scan Error]:', error)
  
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