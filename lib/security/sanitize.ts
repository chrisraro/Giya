// lib/security/sanitize.ts
import { createDOMPurify } from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHTML(content: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return simple text sanitization to avoid DOM-related issues
    return sanitizeText(content);
  }
  
  // Client-side: use full DOMPurify
  const DOMPurify = createDOMPurify(window);
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitizes a plain text string, escaping HTML characters
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and sanitizes URLs
 */
export function sanitizeURL(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return '';
    }
    return parsedUrl.toString();
  } catch (e) {
    // If URL parsing fails, return an empty string
    return '';
  }
}

/**
 * Sanitizes user input for display
 */
export function sanitizeUserInput(input: string): string {
  return sanitizeText(input);
}