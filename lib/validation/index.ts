// lib/validation/index.ts
import { z } from 'zod';

// Common validation schemas
export const idSchema = z.string().cuid().or(z.string().uuid());

export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
});

// Reward validation
export const rewardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  points_required: z.number().int().positive('Points required must be positive'),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  terms: z.string().max(1000).optional(),
  is_active: z.boolean().optional(),
});

// Points transaction validation
export const pointsTransactionSchema = z.object({
  amount_spent: z.number().positive('Amount spent must be positive'),
  points_earned: z.number().int().nonnegative('Points earned must be non-negative'),
});

// Offer validation
export const discountOfferSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  discount_percentage: z.number().min(0).max(100, 'Discount cannot exceed 100%'),
  max_discount_amount: z.number().positive().optional(),
  usage_limit: z.number().int().positive().optional(),
  is_first_time_only: z.boolean().optional(),
  expiration_date: z.string().datetime().optional(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const exclusiveOfferSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  product_name: z.string().min(1, 'Product name is required'),
  original_price: z.number().positive('Original price must be positive'),
  discounted_price: z.number().positive('Discounted price must be positive'),
  usage_limit: z.number().int().positive().optional(),
  is_first_time_only: z.boolean().optional(),
  expiration_date: z.string().datetime().optional(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

// Export types
export type IdInput = z.infer<typeof idSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type RewardInput = z.infer<typeof rewardSchema>;
export type PointsTransactionInput = z.infer<typeof pointsTransactionSchema>;
export type DiscountOfferInput = z.infer<typeof discountOfferSchema>;
export type ExclusiveOfferInput = z.infer<typeof exclusiveOfferSchema>;