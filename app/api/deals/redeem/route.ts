// app/api/deals/redeem/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: Validate a deal redemption using QR code
export async function POST(request: NextRequest) {
  try {
    // Get session from Supabase auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || authError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { qr_code_data, customer_id } = body;

    if (!qr_code_data || !customer_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify this is a valid business user
    const businessId = session.user.id;
    
    // Check if this is a valid business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return Response.json({ error: 'Invalid business' }, { status: 403 });
    }

    // Find the deal by QR code
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        title,
        business_id,
        deal_type,
        discount_percentage,
        discount_value,
        original_price,
        exclusive_price,
        points_required,
        validity_end,
        redemption_limit
      `)
      .eq('qr_code_data', qr_code_data)
      .eq('business_id', businessId) // Ensure it's the business's own deal
      .single();

    if (dealError || !deal) {
      return Response.json({ error: 'Invalid or unauthorized deal QR code' }, { status: 404 });
    }

    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      return Response.json({ error: 'Invalid customer' }, { status: 404 });
    }

    // Check if customer has enough points if required
    if (deal.points_required && deal.points_required > 0) {
      const { data: customerData, error: customerDataError } = await supabase
        .from('customers')
        .select('total_points')
        .eq('id', customer_id)
        .single();

      if (customerDataError) {
        return Response.json({ error: 'Error verifying customer points' }, { status: 500 });
      }

      if (customerData.total_points < deal.points_required) {
        return Response.json({ 
          error: `Customer doesn't have enough points. Required: ${deal.points_required}, Available: ${customerData.total_points}` 
        }, { status: 400 });
      }
    }

    // Check if this deal was already used by this customer
    const { data: existingUsage, error: usageError } = await supabase
      .from('deal_usage')
      .select('id')
      .eq('deal_id', deal.id)
      .eq('customer_id', customer_id)
      .eq('business_id', businessId)
      .single();

    if (existingUsage) {
      return Response.json({ error: 'Deal already used by this customer' }, { status: 400 });
    }

    // Check if deal is still valid (not expired and hasn't reached redemption limit)
    if (deal.validity_end && new Date() > new Date(deal.validity_end)) {
      return Response.json({ error: 'Deal has expired' }, { status: 400 });
    }

    if (deal.redemption_limit) {
      const { count, error: countError } = await supabase
        .from('deal_usage')
        .select('*', { count: 'exact', head: true })
        .eq('deal_id', deal.id);

      if (countError) {
        return Response.json({ error: 'Error checking redemption count' }, { status: 500 });
      }

      if (count && count >= deal.redemption_limit) {
        return Response.json({ error: 'Deal redemption limit reached' }, { status: 400 });
      }
    }

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('deal_usage')
      .insert([{
        deal_id: deal.id,
        customer_id: customer_id,
        business_id: businessId,
        validated_at: new Date().toISOString(),
        points_used: deal.points_required || 0
      }])
      .select()
      .single();

    if (redemptionError) {
      console.error('Error creating deal redemption:', redemptionError);
      return Response.json({ error: 'Error processing deal redemption' }, { status: 500 });
    }

    // If points are required, deduct them from the customer
    if (deal.points_required && deal.points_required > 0) {
      const { error: pointsError } = await supabase.rpc('deduct_customer_points', {
        customer_id_param: customer_id,
        points_to_deduct_param: deal.points_required
      });

      if (pointsError) {
        // Rollback the redemption if we can't deduct points
        await supabase
          .from('deal_usage')
          .delete()
          .eq('id', redemption.id);

        return Response.json({ error: 'Error updating customer points' }, { status: 500 });
      }
    }

    // Return success response with redemption details
    return Response.json({
      message: 'Deal successfully redeemed',
      redemption: {
        id: redemption.id,
        deal_id: redemption.deal_id,
        customer_id: redemption.customer_id,
        business_id: redemption.business_id,
        validated_at: redemption.validated_at,
        points_used: redemption.points_used
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error validating deal redemption:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}