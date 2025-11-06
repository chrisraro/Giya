import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

// Wrapper for API route that checks admin authentication
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("businesses")
      .select(`
        id, 
        business_name, 
        business_category, 
        address, 
        profile_pic_url,
        approval_status,
        created_at,
        gmaps_link
      `)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching pending businesses:", error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Export with admin auth wrapper
export default withAuth(handler, { role: 'admin' });