import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

// Wrapper for API route that checks admin authentication
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessId, reason } = req.body;
    
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const supabase = await createClient();
    
    // Get the admin user who is performing the action
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from("businesses")
      .update({
        approval_status: "rejected",
        is_active: false,
        can_access_dashboard: false,
        rejection_reason: reason || null
      })
      .eq("id", businessId);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Business rejected successfully' });
  } catch (error: any) {
    console.error("Error rejecting business:", error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Export with admin auth wrapper
export default withAuth(handler, { role: 'admin' });