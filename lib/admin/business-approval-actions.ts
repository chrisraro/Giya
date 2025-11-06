"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveBusinessAction(businessId: string) {
  try {
    const supabase = await createClient();
    
    // Get the current user to verify they are an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Check if user is an admin by checking the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      throw new Error("Access denied: Admin role required");
    }

    const { error } = await supabase
      .from("businesses")
      .update({
        approval_status: "approved",
        is_active: true,
        can_access_dashboard: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq("id", businessId);

    if (error) throw error;

    // Revalidate the business approval page
    revalidatePath("/admin/business-approval");
    
    return { success: true, message: "Business approved successfully" };
  } catch (error: any) {
    console.error("Error approving business:", error);
    return { success: false, error: error.message || "Failed to approve business" };
  }
}

export async function rejectBusinessAction(businessId: string, reason?: string) {
  try {
    const supabase = await createClient();
    
    // Get the current user to verify they are an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Check if user is an admin by checking the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      throw new Error("Access denied: Admin role required");
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

    // Revalidate the business approval page
    revalidatePath("/admin/business-approval");
    
    return { success: true, message: "Business rejected successfully" };
  } catch (error: any) {
    console.error("Error rejecting business:", error);
    return { success: false, error: error.message || "Failed to reject business" };
  }
}

export async function fetchPendingBusinessesAction() {
  try {
    const supabase = await createClient();
    
    // Get the current user to verify they are an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Check if user is an admin by checking the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      throw new Error("Access denied: Admin role required");
    }

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

    return data || [];
  } catch (error: any) {
    console.error("Error fetching pending businesses:", error);
    throw new Error(error.message || "Failed to fetch pending businesses");
  }
}