"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ProfileImageUpload } from "@/components/profile-image-upload";

interface CustomerData {
  id: string;
  full_name: string;
  nickname: string | null;
  profile_pic_url: string | null;
  qr_code_data: string;
  total_points: number;
}

export default function CustomerProfilePage() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    nickname: ""
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setCustomer(data);
      setFormData({
        full_name: data.full_name,
        nickname: data.nickname || ""
      });
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpdate = (newImageUrl: string | null) => {
    if (customer) {
      setCustomer({
        ...customer,
        profile_pic_url: newImageUrl
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer) return;
    
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          full_name: formData.full_name,
          nickname: formData.nickname || null
        })
        .eq("id", customer.id);
        
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      fetchCustomerData(); // Refresh data
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        userRole="customer"
        userName="Loading..."
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout
        userRole="customer"
        userName="Error"
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Unable to load profile data</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole="customer"
      userName={customer.full_name}
      userEmail={customer.nickname ? `@${customer.nickname}` : undefined}
      userAvatar={customer.profile_pic_url}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/customer" },
        { label: "Profile", href: "/dashboard/customer/profile" }
      ]}
    >
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your profile information and avatar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-6">
                  <ProfileImageUpload
                    currentImageUrl={customer.profile_pic_url}
                    userId={customer.id}
                    userType="customer"
                    onImageUpdate={handleImageUpdate}
                    size="lg"
                  />
                  
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nickname">Nickname</Label>
                      <Input
                        id="nickname"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        placeholder="Your username"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>QR Code</Label>
                      <div className="rounded-lg bg-muted p-4 text-center">
                        <p className="text-sm font-medium">{customer.qr_code_data}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Total Points</Label>
                      <div className="rounded-lg bg-primary/10 p-4 text-center">
                        <p className="text-2xl font-bold text-primary">{customer.total_points}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}