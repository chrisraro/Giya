-- Create admin analytics views and functions for platform insights
-- Provides comprehensive analytics for admins to monitor platform health

-- View: Platform Overview Stats
CREATE OR REPLACE VIEW admin_platform_stats AS
SELECT
  (SELECT COUNT(*) FROM public.customers) AS total_customers,
  (SELECT COUNT(*) FROM public.businesses WHERE approval_status = 'approved') AS total_approved_businesses,
  (SELECT COUNT(*) FROM public.businesses WHERE approval_status = 'pending') AS pending_businesses,
  (SELECT COUNT(*) FROM public.businesses WHERE approval_status = 'suspended') AS suspended_businesses,
  (SELECT COUNT(*) FROM public.admins WHERE is_active = true) AS total_admins,
  (SELECT COUNT(*) FROM public.rewards) AS total_rewards,
  (SELECT COUNT(*) FROM public.deals) AS total_deals,
  (SELECT COUNT(*) FROM public.menu_items) AS total_menu_items,
  (SELECT COUNT(*) FROM public.points_transactions) AS total_transactions,
  (SELECT COALESCE(SUM(points_earned), 0) FROM public.points_transactions) AS total_points_issued,
  (SELECT COALESCE(SUM(points_redeemed), 0) FROM public.redemptions) AS total_points_redeemed,
  (SELECT COUNT(*) FROM public.redemptions WHERE status = 'validated') AS total_validated_redemptions,
  (SELECT COUNT(*) FROM public.deal_usage WHERE validated = true) AS total_deal_redemptions;

-- Grant access to admins only
GRANT SELECT ON admin_platform_stats TO authenticated;

-- View: Business Analytics
CREATE OR REPLACE VIEW admin_business_analytics AS
SELECT
  b.id,
  b.business_name,
  b.business_category,
  b.approval_status,
  b.is_active,
  b.created_at,
  b.approved_at,
  COUNT(DISTINCT pt.id) AS transaction_count,
  COALESCE(SUM(pt.points_earned), 0) AS total_points_issued,
  COUNT(DISTINCT r.id) AS rewards_count,
  COUNT(DISTINCT d.id) AS deals_count,
  COUNT(DISTINCT mi.id) AS menu_items_count,
  COUNT(DISTINCT CASE WHEN red.status = 'validated' THEN red.id END) AS redemptions_count,
  COALESCE(AVG(pt.amount_spent), 0) AS avg_transaction_value
FROM public.businesses b
LEFT JOIN public.points_transactions pt ON b.id = pt.business_id
LEFT JOIN public.rewards r ON b.id = r.business_id
LEFT JOIN public.deals d ON b.id = d.business_id
LEFT JOIN public.menu_items mi ON b.id = mi.business_id
LEFT JOIN public.redemptions red ON b.id = red.business_id
GROUP BY b.id, b.business_name, b.business_category, b.approval_status, b.is_active, b.created_at, b.approved_at;

GRANT SELECT ON admin_business_analytics TO authenticated;

-- View: Customer Analytics
CREATE OR REPLACE VIEW admin_customer_analytics AS
SELECT
  c.id,
  c.full_name,
  c.total_points,
  c.created_at,
  COUNT(DISTINCT pt.id) AS transaction_count,
  COALESCE(SUM(pt.points_earned), 0) AS lifetime_points_earned,
  COUNT(DISTINCT red.id) AS redemptions_count,
  COALESCE(SUM(red.points_redeemed), 0) AS lifetime_points_redeemed,
  COUNT(DISTINCT pt.business_id) AS businesses_visited,
  COALESCE(MAX(pt.transaction_date), c.created_at) AS last_transaction_date
FROM public.customers c
LEFT JOIN public.points_transactions pt ON c.id = pt.customer_id
LEFT JOIN public.redemptions red ON c.id = red.customer_id
GROUP BY c.id, c.full_name, c.total_points, c.created_at;

GRANT SELECT ON admin_customer_analytics TO authenticated;

-- Function: Get platform growth metrics
CREATE OR REPLACE FUNCTION get_platform_growth_metrics(
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  new_customers BIGINT,
  new_businesses BIGINT,
  transactions BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - p_days_back,
      CURRENT_DATE,
      '1 day'::interval
    )::DATE AS date
  )
  SELECT
    ds.date,
    COUNT(DISTINCT c.id) AS new_customers,
    COUNT(DISTINCT b.id) AS new_businesses,
    COUNT(DISTINCT pt.id) AS transactions,
    COALESCE(SUM(pt.amount_spent), 0) AS total_revenue
  FROM date_series ds
  LEFT JOIN public.customers c ON DATE(c.created_at) = ds.date
  LEFT JOIN public.businesses b ON DATE(b.created_at) = ds.date
  LEFT JOIN public.points_transactions pt ON DATE(pt.transaction_date) = ds.date
  GROUP BY ds.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get top performing businesses
CREATE OR REPLACE FUNCTION get_top_businesses(
  p_limit INTEGER DEFAULT 10,
  p_metric TEXT DEFAULT 'transactions' -- 'transactions', 'revenue', 'customers'
)
RETURNS TABLE (
  business_id UUID,
  business_name TEXT,
  metric_value NUMERIC
) AS $$
BEGIN
  IF p_metric = 'transactions' THEN
    RETURN QUERY
    SELECT
      b.id AS business_id,
      b.business_name,
      COUNT(pt.id)::NUMERIC AS metric_value
    FROM public.businesses b
    LEFT JOIN public.points_transactions pt ON b.id = pt.business_id
    WHERE b.approval_status = 'approved' AND b.is_active = true
    GROUP BY b.id, b.business_name
    ORDER BY metric_value DESC
    LIMIT p_limit;
  ELSIF p_metric = 'revenue' THEN
    RETURN QUERY
    SELECT
      b.id AS business_id,
      b.business_name,
      COALESCE(SUM(pt.amount_spent), 0) AS metric_value
    FROM public.businesses b
    LEFT JOIN public.points_transactions pt ON b.id = pt.business_id
    WHERE b.approval_status = 'approved' AND b.is_active = true
    GROUP BY b.id, b.business_name
    ORDER BY metric_value DESC
    LIMIT p_limit;
  ELSIF p_metric = 'customers' THEN
    RETURN QUERY
    SELECT
      b.id AS business_id,
      b.business_name,
      COUNT(DISTINCT pt.customer_id)::NUMERIC AS metric_value
    FROM public.businesses b
    LEFT JOIN public.points_transactions pt ON b.id = pt.business_id
    WHERE b.approval_status = 'approved' AND b.is_active = true
    GROUP BY b.id, b.business_name
    ORDER BY metric_value DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get recent activity feed
CREATE OR REPLACE FUNCTION get_recent_activity(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  activity_type TEXT,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 'new_customer'::TEXT, 
           jsonb_build_object('id', id, 'name', full_name), 
           created_at
    FROM public.customers
    ORDER BY created_at DESC
    LIMIT p_limit / 4
  )
  UNION ALL
  (
    SELECT 'new_business'::TEXT,
           jsonb_build_object('id', id, 'name', business_name, 'category', business_category),
           created_at
    FROM public.businesses
    ORDER BY created_at DESC
    LIMIT p_limit / 4
  )
  UNION ALL
  (
    SELECT 'transaction'::TEXT,
           jsonb_build_object('id', id, 'amount', amount_spent, 'points', points_earned),
           transaction_date
    FROM public.points_transactions
    ORDER BY transaction_date DESC
    LIMIT p_limit / 4
  )
  UNION ALL
  (
    SELECT 'redemption'::TEXT,
           jsonb_build_object('id', id, 'points', points_redeemed, 'status', status),
           created_at
    FROM public.redemptions
    ORDER BY created_at DESC
    LIMIT p_limit / 4
  )
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON VIEW admin_platform_stats IS 'Overview statistics for the entire platform';
COMMENT ON VIEW admin_business_analytics IS 'Detailed analytics for each business';
COMMENT ON VIEW admin_customer_analytics IS 'Detailed analytics for each customer';
COMMENT ON FUNCTION get_platform_growth_metrics IS 'Returns daily growth metrics for specified time period';
COMMENT ON FUNCTION get_top_businesses IS 'Returns top performing businesses by specified metric';
COMMENT ON FUNCTION get_recent_activity IS 'Returns recent platform activity feed';
