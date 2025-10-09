# Rewards Page Debug Guide

## Common Issues and Solutions

### 1. Rewards Not Displaying

#### Symptoms
- Page shows "No rewards available"
- Empty reward grid
- Console errors about column names

#### Diagnosis Steps
1. Check browser console for errors
2. Verify Supabase query in Network tab
3. Check database schema for correct column names

#### Solutions
- Ensure query uses correct column names (`reward_name` not `name`)
- Verify database has active rewards
- Check RLS policies allow customer access

### 2. Points Not Displaying Correctly

#### Symptoms
- Incorrect point balances
- "Need X more points" shows wrong number
- Points don't update after transactions

#### Diagnosis Steps
1. Check points_transactions table
2. Verify redemptions table entries
3. Confirm customer ID filtering

#### Solutions
- Verify points calculation logic
- Check for missing transactions
- Ensure proper aggregation of points

### 3. Business Filtering Issues

#### Symptoms
- Business-specific rewards don't show
- Wrong business information displayed
- Category filtering fails

#### Diagnosis Steps
1. Check business ID matching
2. Verify business table relationships
3. Test category data integrity

#### Solutions
- Ensure proper business ID filtering
- Check for null business references
- Verify category data consistency

## Debugging Tools

### Browser Console Commands

```javascript
// Check if Supabase is available
console.log('Supabase available:', typeof supabase !== 'undefined');

// Test rewards query
supabase.from("rewards")
  .select("id,business_id,reward_name,description,points_required,businesses(business_name,business_category)")
  .eq("is_active", true)
  .order("points_required", { ascending: true })
  .then(result => {
    console.log('Rewards query result:', result);
  });

// Check current user
supabase.auth.getUser().then(result => {
  console.log('Current user:', result);
});

// Test points calculation
supabase.from("points_transactions")
  .select("business_id, points_earned")
  .eq("customer_id", "USER_ID_HERE")
  .then(result => {
    console.log('Points transactions:', result);
  });
```

### Database Queries

```sql
-- Check rewards table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rewards' 
ORDER BY ordinal_position;

-- Count active rewards
SELECT COUNT(*) as active_rewards 
FROM rewards 
WHERE is_active = true;

-- Check sample reward with business
SELECT r.id, r.reward_name, r.points_required, b.business_name, b.business_category
FROM rewards r
JOIN businesses b ON r.business_id = b.id
WHERE r.is_active = true
LIMIT 5;

-- Check customer points
SELECT c.id, c.full_name, c.total_points
FROM customers c
WHERE c.id = 'CUSTOMER_ID_HERE';
```

## Testing Checklist

### Basic Functionality
- [ ] Rewards page loads without errors
- [ ] Active rewards are displayed
- [ ] Reward names show correctly
- [ ] Points required are accurate
- [ ] Business information displays
- [ ] Category information shows

### Points System
- [ ] Customer points display correctly
- [ ] Points calculation is accurate
- [ ] "Need more points" messaging works
- [ ] Points update after transactions

### Filtering
- [ ] Category filtering works
- [ ] Business-specific viewing works
- [ ] Combined filters work
- [ ] Clear filters functionality

### Redemption Flow
- [ ] Redeem button enabled when points sufficient
- [ ] Redeem button disabled when points insufficient
- [ ] Confirmation dialog shows correct information
- [ ] QR code generates properly
- [ ] Toast notifications appear

## Common Error Messages

### "column rewards.name does not exist"
**Cause**: Querying for wrong column name
**Solution**: Use `reward_name` instead of `name`

### "RLS policy violation"
**Cause**: Insufficient permissions
**Solution**: Check user authentication and RLS policies

### "No rewards available"
**Cause**: No active rewards or query returning empty
**Solution**: Verify rewards exist and query is correct

### "Invalid business ID"
**Cause**: Business ID mismatch or null values
**Solution**: Check business ID filtering logic

## Performance Considerations

### Query Optimization
- Use specific column selection instead of `*`
- Limit results when appropriate
- Use indexes for frequently queried columns
- Avoid N+1 query problems

### Loading States
- Show skeleton loaders during data fetch
- Handle loading states gracefully
- Provide user feedback for long operations

### Caching
- Consider caching frequently accessed data
- Implement proper cache invalidation
- Use SWR or React Query for complex caching needs

## Rollback Procedures

### Quick Fixes
1. Revert to last known working version
2. Check Supabase logs for errors
3. Verify database schema matches expectations
4. Test with sample data

### Database Rollback
1. Restore from last backup if needed
2. Reapply known working schema
3. Verify data integrity
4. Test functionality

### Code Rollback
1. Git revert recent changes
2. Verify dependencies are correct
3. Test in development environment
4. Deploy to production

This guide should help diagnose and resolve most issues with the rewards page functionality.