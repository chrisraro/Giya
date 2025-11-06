"use server";

import { createClient } from "@/lib/supabase/server";

export async function approveBusiness(businessId: string, adminId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("businesses")
    .update({
      approval_status: "approved",
      is_active: true,
      can_access_dashboard: true,
      approved_at: new Date().toISOString(),
      approved_by: adminId
    })
    .eq("id", businessId);

  if (error) {
    console.error("Error approving business:", error);
    throw new Error("Failed to approve business");
  }

  return { success: true, message: "Business approved successfully" };
}

export async function rejectBusiness(businessId: string, adminId: string, reason?: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("businesses")
    .update({
      approval_status: "rejected",
      is_active: false,
      can_access_dashboard: false,
      rejection_reason: reason || null
    })
    .eq("id", businessId);

  if (error) {
    console.error("Error rejecting business:", error);
    throw new Error("Failed to reject business");
  }

  return { success: true, message: "Business rejected successfully" };
}

export async function fetchPendingBusinesses() {
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

  if (error) {
    console.error("Error fetching pending businesses:", error);
    throw new Error("Failed to fetch pending businesses");
  }

  return data;
}