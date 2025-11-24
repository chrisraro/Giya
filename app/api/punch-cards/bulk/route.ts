import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Helper function to create Supabase client from request
function createClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Extract cookies from the request
  const cookies = request.headers.get('Cookie') ?? '';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = cookies.split(';').find(c => c.trim().startsWith(`${name}=`));
        if (cookie) {
          const value = cookie.split('=')[1];
          return decodeURIComponent(value);
        }
        return undefined;
      },
    },
  });
}

// Helper function to get session
async function getSession(request: NextRequest) {
  const supabase = createClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

// POST: Bulk operations for punch cards
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, data } = body;

    if (!operation || !data) {
      return Response.json({ error: 'Missing operation or data' }, { status: 400 });
    }

    const supabase = createClient(request);

    switch (operation) {
      case 'bulk_add_punches': {
        // Expecting data to be an array of { punch_card_id, customer_id, transaction_id }
        if (!Array.isArray(data)) {
          return Response.json({ error: 'Data must be an array for bulk_add_punches operation' }, { status: 400 });
        }

        // Validate data structure
        for (const item of data) {
          if (!item.punch_card_id || !item.customer_id) {
            return Response.json({ error: 'Each item must have punch_card_id and customer_id' }, { status: 400 });
          }
        }

        // Process each punch addition
        const results = [];
        const errors = [];

        for (const item of data) {
          try {
            // First, get the punch card customer record
            const { data: punchCardCustomer, error: customerError } = await supabase
              .from('punch_card_customers')
              .select(`
                id,
                punches_count,
                is_completed,
                punch_cards (
                  id,
                  business_id,
                  punches_required
                )
              `)
              .eq('punch_card_id', item.punch_card_id)
              .eq('customer_id', item.customer_id)
              .single();

            if (customerError || !punchCardCustomer) {
              errors.push({
                item,
                error: customerError?.message || 'Customer not enrolled in this punch card'
              });
              continue;
            }

            // Check if business owns this punch card
            if (punchCardCustomer.punch_cards.business_id !== session.user.id) {
              errors.push({
                item,
                error: 'Unauthorized: You do not own this punch card'
              });
              continue;
            }

            // Check if punch card is already completed
            if (punchCardCustomer.is_completed) {
              errors.push({
                item,
                error: 'Punch card already completed'
              });
              continue;
            }

            // Add the punch
            const { data: newPunch, error: punchError } = await supabase
              .from('punch_card_punches')
              .insert([{
                punch_card_customer_id: punchCardCustomer.id,
                business_id: punchCardCustomer.punch_cards.business_id,
                customer_id: item.customer_id,
                transaction_id: item.transaction_id || null,
                validated_by: session.user.id
              }])
              .select()
              .single();

            if (punchError) {
              errors.push({
                item,
                error: punchError.message
              });
              continue;
            }

            // Update the customer's punch count
            const newPunchCount = punchCardCustomer.punches_count + 1;
            const isCompleted = newPunchCount >= punchCardCustomer.punch_cards.punches_required;

            const { error: updateError } = await supabase
              .from('punch_card_customers')
              .update({
                punches_count: newPunchCount,
                last_punch_at: new Date().toISOString(),
                completed_at: isCompleted ? new Date().toISOString() : null,
                is_completed: isCompleted
              })
              .eq('id', punchCardCustomer.id);

            if (updateError) {
              // Try to rollback the punch if updating the count failed
              await supabase
                .from('punch_card_punches')
                .delete()
                .eq('id', newPunch.id);

              errors.push({
                item,
                error: updateError.message
              });
              continue;
            }

            results.push({
              item,
              punch: newPunch,
              message: isCompleted ? 'Punch card completed! Reward unlocked.' : 'Punch added successfully.',
              is_completed: isCompleted
            });
          } catch (error) {
            errors.push({
              item,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        return Response.json({
          success: true,
          results,
          errors,
          message: `Processed ${results.length} punches successfully, ${errors.length} errors`
        }, { status: 200 });
      }

      case 'bulk_create_punch_cards': {
        // Expecting data to be an array of punch card objects
        if (!Array.isArray(data)) {
          return Response.json({ error: 'Data must be an array for bulk_create_punch_cards operation' }, { status: 400 });
        }

        // Validate data structure
        for (const item of data) {
          if (!item.title || !item.punches_required || !item.reward_description) {
            return Response.json({ 
              error: 'Each punch card must have title, punches_required, and reward_description' 
            }, { status: 400 });
          }
        }

        // Add business_id to each item
        const punchCardsToCreate = data.map(item => ({
          ...item,
          business_id: session.user.id,
          is_active: item.is_active ?? true,
          valid_from: item.valid_from || new Date().toISOString()
        }));

        const { data: createdPunchCards, error } = await supabase
          .from('punch_cards')
          .insert(punchCardsToCreate)
          .select();

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
          success: true,
          data: createdPunchCards,
          message: `Created ${createdPunchCards.length} punch cards successfully`
        }, { status: 201 });
      }

      case 'bulk_update_punch_cards': {
        // Expecting data to be an array of { id, ...update_fields }
        if (!Array.isArray(data)) {
          return Response.json({ error: 'Data must be an array for bulk_update_punch_cards operation' }, { status: 400 });
        }

        // Validate data structure
        for (const item of data) {
          if (!item.id) {
            return Response.json({ error: 'Each item must have an id' }, { status: 400 });
          }
        }

        // Process updates
        const results = [];
        const errors = [];

        for (const item of data) {
          try {
            const { id, ...updateFields } = item;
            
            // Verify business owns this punch card
            const { data: existingCard, error: fetchError } = await supabase
              .from('punch_cards')
              .select('business_id')
              .eq('id', id)
              .eq('business_id', session.user.id)
              .single();

            if (fetchError || !existingCard) {
              errors.push({
                id,
                error: 'Punch card not found or unauthorized'
              });
              continue;
            }

            const { data: updatedCard, error: updateError } = await supabase
              .from('punch_cards')
              .update(updateFields)
              .eq('id', id)
              .eq('business_id', session.user.id)
              .select()
              .single();

            if (updateError) {
              errors.push({
                id,
                error: updateError.message
              });
              continue;
            }

            results.push(updatedCard);
          } catch (error) {
            errors.push({
              id: item.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        return Response.json({
          success: true,
          results,
          errors,
          message: `Updated ${results.length} punch cards successfully, ${errors.length} errors`
        }, { status: 200 });
      }

      case 'bulk_delete_punch_cards': {
        // Expecting data to be an array of punch card IDs
        if (!Array.isArray(data)) {
          return Response.json({ error: 'Data must be an array for bulk_delete_punch_cards operation' }, { status: 400 });
        }

        // Validate data structure
        for (const id of data) {
          if (typeof id !== 'string') {
            return Response.json({ error: 'All items must be punch card IDs (strings)' }, { status: 400 });
          }
        }

        // Delete punch cards owned by the business
        const { error } = await supabase
          .from('punch_cards')
          .delete()
          .in('id', data)
          .eq('business_id', session.user.id);

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
          success: true,
          message: `Deleted ${data.length} punch cards successfully`
        }, { status: 200 });
      }

      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing bulk operation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}