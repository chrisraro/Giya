# Affiliate System Implementation

## Overview
This document describes the implementation of the affiliate system for influencers in the Giya app. The system allows influencers to generate referral links, track conversions, and earn points for successful referrals and customer transactions.

## Features Implemented

### 1. Affiliate Link Generation
- Influencers can generate unique affiliate links for businesses
- Links follow the format: `/signup?ref={unique_code}`
- Each link is associated with a specific influencer and business

### 2. Conversion Tracking
- When customers sign up through affiliate links, conversions are tracked
- Each successful referral earns the influencer 10 points
- Conversion data is stored in the `affiliate_conversions` table

### 3. Transaction-Based Point Earnings
- Influencers earn 1 additional point for each transaction made by referred customers
- Points are automatically awarded when customers make purchases

### 4. Dashboard Updates
- Influencer dashboard displays total points including affiliate earnings
- Conversion history shows points earned from each referral
- Clear indication of points earned from affiliate activities

## Technical Implementation

### Database Changes
1. Added `referral_code` column to `customers` table
2. Enhanced `affiliate_conversions` table with `points_earned` column
3. Created database functions and triggers for automatic point allocation

### Backend Functions
1. `track_affiliate_conversion()` - Tracks signups through affiliate links
2. `award_influencer_points_for_transaction()` - Awards points for customer transactions

### Frontend Updates
1. Modified customer signup flow to capture referral codes
2. Enhanced influencer dashboard to display affiliate earnings
3. Updated UI to show points earned from conversions

## How It Works

### 1. Link Generation
1. Influencer visits dashboard and generates affiliate link for a business
2. Unique referral code is created and associated with the influencer-business relationship
3. Link is formatted as: `https://yourdomain.com/signup?ref={unique_code}`

### 2. Customer Signup
1. Customer clicks affiliate link and lands on signup page
2. Referral code is captured from URL parameters
3. During account setup, referral code is stored with customer data

### 3. Conversion Tracking
1. When customer account is created, database trigger checks for referral code
2. If present, conversion record is created and 10 points awarded to influencer
3. Conversion appears in influencer's dashboard

### 4. Transaction Earnings
1. When referred customer makes a purchase, database trigger checks referral status
2. If customer was referred, 1 point is awarded to the influencer
3. Conversion record is updated to reflect additional points

## Testing
To test the complete flow:
1. Generate an affiliate link from influencer dashboard
2. Use the link to sign up a new customer account
3. Verify conversion appears in influencer dashboard with 10 points
4. Complete a transaction as the referred customer
5. Verify influencer receives additional point and conversion record updates

## Future Enhancements
- Add expiration dates for affiliate links
- Implement performance analytics for influencers
- Add tiered reward system based on conversion volume
- Create affiliate leaderboard for competitive engagement