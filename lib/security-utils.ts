import { createClient } from '@/lib/supabase/client';

// Function to validate receipt ownership
export async function validateReceiptOwnership(receiptId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('customer_id')
      .eq('id', receiptId)
      .single();
      
    if (error) throw error;
    
    return data.customer_id === userId;
  } catch (error) {
    console.error('Error validating receipt ownership:', error);
    return false;
  }
}

// Function to validate business access to receipt
export async function validateBusinessReceiptAccess(receiptId: string, businessId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('business_id')
      .eq('id', receiptId)
      .single();
      
    if (error) throw error;
    
    return data.business_id === businessId;
  } catch (error) {
    console.error('Error validating business receipt access:', error);
    return false;
  }
}

// Function to sanitize user input
export function sanitizeUserInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

// Function to validate phone number format
export function validatePhoneNumber(phone: string): boolean {
  // Philippine phone number format validation
  const phoneRegex = /^(09|\+639)\d{9}$/;
  return phoneRegex.test(phone);
}

// Function to validate image file
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Only JPEG, PNG, and WebP images are allowed' 
    };
  }
  
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { 
      isValid: false, 
      error: 'File size must be less than 10MB' 
    };
  }
  
  return { isValid: true };
}

// Function to rate limit API calls
export class RateLimiter {
  private static instances: Map<string, RateLimiter> = new Map();
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  
  private constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  static getInstance(key: string, maxRequests: number = 10, windowMs: number = 60000): RateLimiter {
    if (!RateLimiter.instances.has(key)) {
      RateLimiter.instances.set(key, new RateLimiter(maxRequests, windowMs));
    }
    return RateLimiter.instances.get(key)!;
  }
  
  isAllowed(): boolean {
    const now = Date.now();
    // Remove requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
  
  getRemainingRequests(): number {
    return this.maxRequests - this.requests.length;
  }
  
  getWindowMs(): number {
    return this.windowMs;
  }
}

// Function to check if user is authenticated
export async function isAuthenticated(): Promise<{ isAuthenticated: boolean; userId?: string; role?: string }> {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (!session || !session.user) {
      return { isAuthenticated: false };
    }
    
    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (profileError) throw profileError;
    
    return { 
      isAuthenticated: true, 
      userId: session.user.id, 
      role: profile.role 
    };
  } catch (error) {
    console.error('Error checking authentication:', error);
    return { isAuthenticated: false };
  }
}

// Function to check if user has required role
export async function hasRole(requiredRole: string): Promise<boolean> {
  const auth = await isAuthenticated();
  
  if (!auth.isAuthenticated) {
    return false;
  }
  
  return auth.role === requiredRole;
}

// Function to log security events
export function logSecurityEvent(event: string, details: any): void {
  // In a real implementation, this would send logs to a security monitoring service
  console.log(`[SECURITY] ${new Date().toISOString()} - ${event}`, details);
  
  // For demo purposes, we'll just log to console
  // In production, you might want to send this to a logging service
}

// Function to validate affiliate link
export async function validateAffiliateLink(linkId: string, businessId: string): Promise<boolean> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('business_id')
      .eq('id', linkId)
      .single();
      
    if (error) throw error;
    
    return data.business_id === businessId;
  } catch (error) {
    console.error('Error validating affiliate link:', error);
    return false;
  }
}

// Function to validate QR code format
export function validateQRCodeFormat(qrCode: string): { isValid: boolean; error?: string } {
  // Expected format: "giya://table/{business_id}/{table_id}"
  const qrParts = qrCode.split('/');
  
  if (qrParts.length < 5) {
    return { 
      isValid: false, 
      error: 'Invalid QR code format' 
    };
  }
  
  if (qrParts[0] !== 'giya:' || qrParts[1] !== '' || qrParts[2] !== 'table') {
    return { 
      isValid: false, 
      error: 'Invalid QR code protocol or path' 
    };
  }
  
  // Validate UUID format for business_id and table_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(qrParts[3])) {
    return { 
      isValid: false, 
      error: 'Invalid business ID format' 
    };
  }
  
  if (!uuidRegex.test(qrParts[4])) {
    return { 
      isValid: false, 
      error: 'Invalid table ID format' 
    };
  }
  
  return { isValid: true };
}

// Function to validate receipt processing request
export async function validateReceiptProcessingRequest(
  receiptId: string, 
  userId: string
): Promise<{ isValid: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    // Check if receipt exists and belongs to user
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('customer_id, status')
      .eq('id', receiptId)
      .single();
      
    if (receiptError) {
      return { 
        isValid: false, 
        error: 'Receipt not found' 
      };
    }
    
    // Check ownership
    if (receipt.customer_id !== userId) {
      return { 
        isValid: false, 
        error: 'Unauthorized access to receipt' 
      };
    }
    
    // Check status (must be 'uploaded' to process)
    if (receipt.status !== 'uploaded') {
      return { 
        isValid: false, 
        error: 'Receipt is not in a valid state for processing' 
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error validating receipt processing request:', error);
    return { 
      isValid: false, 
      error: 'Failed to validate receipt processing request' 
    };
  }
}

// Function to sanitize and validate affiliate referral code
export function validateAffiliateReferralCode(code: string): { isValid: boolean; error?: string } {
  // Referral codes should be 6-12 alphanumeric characters
  const codeRegex = /^[A-Z0-9]{6,12}$/;
  
  if (!codeRegex.test(code)) {
    return { 
      isValid: false, 
      error: 'Invalid referral code format. Must be 6-12 uppercase alphanumeric characters.' 
    };
  }
  
  return { isValid: true };
}

// Function to implement request throttling for sensitive operations
export class SensitiveOperationThrottler {
  private static instances: Map<string, SensitiveOperationThrottler> = new Map();
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  
  private constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  static getInstance(key: string, maxRequests: number = 5, windowMs: number = 300000): SensitiveOperationThrottler { // 5 requests per 5 minutes
    if (!SensitiveOperationThrottler.instances.has(key)) {
      SensitiveOperationThrottler.instances.set(key, new SensitiveOperationThrottler(maxRequests, windowMs));
    }
    return SensitiveOperationThrottler.instances.get(key)!;
  }
  
  isAllowed(): boolean {
    const now = Date.now();
    // Remove requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
  
  getRemainingRequests(): number {
    return this.maxRequests - this.requests.length;
  }
  
  getWindowMs(): number {
    return this.windowMs;
  }
}

// Function to detect suspicious activity
export function detectSuspiciousActivity(activity: string, userId: string): boolean {
  // Log the activity for monitoring
  logSecurityEvent('User Activity', { activity, userId, timestamp: new Date().toISOString() });
  
  // In a real implementation, this would check against known patterns of suspicious behavior
  // For demo, we'll just return false
  return false;
}