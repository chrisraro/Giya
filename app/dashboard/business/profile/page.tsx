"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ProfileImageUpload } from "@/components/profile-image-upload";

interface BusinessData {
  id: string;
  business_name: string;
  business_category: string;
  address: string;
  profile_pic_url: string | null;
  points_per_currency: number;
  gmaps_link: string | null;
}

export default function BusinessProfilePage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    business_name: "",
    business_category: "",
    address: "",
    points_per_currency: "100",
    gmaps_link: ""
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setBusiness(data);
      setFormData({
        business_name: data.business_name,
        business_category: data.business_category,
        address: data.address,
        points_per_currency: data.points_per_currency?.toString() || "100",
        gmaps_link: data.gmaps_link || ""
      });
    } catch (error) {
      console.error("Error fetching business data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpdate = (newImageUrl: string | null) => {
    if (business) {
      setBusiness({
        ...business,
        profile_pic_url: newImageUrl
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!business) return;
    
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          business_name: formData.business_name,
          business_category: formData.business_category,
          address: formData.address,
          points_per_currency: parseInt(formData.points_per_currency),
          gmaps_link: formData.gmaps_link || null
        })
        .eq("id", business.id);
        
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      fetchBusinessData(); // Refresh data
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        userRole="business"
        userName="Loading..."
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout
        userRole="business"
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
      userRole="business"
      userName={business.business_name}
      userEmail={business.business_category}
      userAvatar={business.profile_pic_url}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/business" },
        { label: "Profile", href: "/dashboard/business/profile" }
      ]}
    >
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Manage your business information and logo</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-6">
                  <ProfileImageUpload
                    currentImageUrl={business.profile_pic_url}
                    userId={business.id}
                    userType="business"
                    onImageUpdate={handleImageUpdate}
                    size="lg"
                  />
                  
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business Name</Label>
                      <Input
                        id="business_name"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="business_category">Business Category</Label>
                      <Input
                        id="business_category"
                        name="business_category"
                        value={formData.business_category}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="points_per_currency">Points per Currency Unit</Label>
                      <Input
                        id="points_per_currency"
                        name="points_per_currency"
                        type="number"
                        min="1"
                        value={formData.points_per_currency}
                        onChange={handleInputChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        How many points customers earn per currency unit spent
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gmaps_link">Google Maps Link (Optional)</Label>
                      <Input
                        id="gmaps_link"
                        name="gmaps_link"
                        value={formData.gmaps_link}
                        onChange={handleInputChange}
                        placeholder="https://maps.google.com/..."
                      />
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