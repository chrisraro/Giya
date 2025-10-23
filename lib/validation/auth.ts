// lib/validation/auth.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'business', 'influencer']),
  // Customer fields
  fullName: z.string().optional(),
  nickname: z.string().optional(),
  // Business fields
  businessName: z.string().optional(),
  businessCategory: z.string().optional(),
  address: z.string().optional(),
  gmapsLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  // Influencer fields
  influencerAddress: z.string().optional(),
  facebookLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  tiktokLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitterLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  youtubeLink: z.string().url('Invalid URL').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const customerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  nickname: z.string().optional(),
});

export const businessSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  business_category: z.string().min(2, 'Business category is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  gmaps_link: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const influencerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  facebook_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  tiktok_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  youtube_link: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// Export types
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type InfluencerInput = z.infer<typeof influencerSchema>;