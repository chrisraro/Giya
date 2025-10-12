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

interface InfluencerData {
  id: string;
  full_name: string;
  profile_pic_url: string | null;
  address: string | null;
  facebook_link: string | null;
  tiktok_link: string | null;
  twitter_link: string | null;
  youtube_link: string | null;
  total_points: number;
}

export default function InfluencerProfilePage() {
  const [influencer, setInfluencer] = useState<InfluencerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    address: "",
    facebook_link: "",
    tiktok_link: "",
    twitter_link: "",
    youtube_link: ""
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchInfluencerData();
  }, []);

  const fetchInfluencerData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("influencers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setInfluencer(data);
      setFormData({
        full_name: data.full_name,
        address: data.address || "",
        facebook_link: data.facebook_link || "",
        tiktok_link: data.tiktok_link || "",
        twitter_link: data.twitter_link || "",
        youtube_link: data.youtube_link || ""
      });
    } catch (error) {
      console.error("Error fetching influencer data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpdate = (newImageUrl: string | null) => {
    if (influencer) {
      setInfluencer({
        ...influencer,
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
    
    if (!influencer) return;
    
    try {
      const { error } = await supabase
        .from("influencers")
        .update({
          full_name: formData.full_name,
          address: formData.address || null,
          facebook_link: formData.facebook_link || null,
          tiktok_link: formData.tiktok_link || null,
          twitter_link: formData.twitter_link || null,
          youtube_link: formData.youtube_link || null
        })
        .eq("id", influencer.id);
        
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      fetchInfluencerData(); // Refresh data
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        userRole="influencer"
        userName="Loading..."
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!influencer) {
    return (
      <DashboardLayout
        userRole="influencer"
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
      userRole="influencer"
      userName={influencer.full_name}
      userAvatar={influencer.profile_pic_url}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/influencer" },
        { label: "Profile", href: "/dashboard/influencer/profile" }
      ]}
    >
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Influencer Profile</CardTitle>
              <CardDescription>Manage your profile information and avatar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-6">
                  <ProfileImageUpload
                    currentImageUrl={influencer.profile_pic_url}
                    userId={influencer.id}
                    userType="influencer"
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
                      <Label htmlFor="address">Address (Optional)</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Social Media Links</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="facebook_link">Facebook</Label>
                        <Input
                          id="facebook_link"
                          name="facebook_link"
                          value={formData.facebook_link}
                          onChange={handleInputChange}
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tiktok_link">TikTok</Label>
                        <Input
                          id="tiktok_link"
                          name="tiktok_link"
                          value={formData.tiktok_link}
                          onChange={handleInputChange}
                          placeholder="https://tiktok.com/..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="twitter_link">Twitter/X</Label>
                        <Input
                          id="twitter_link"
                          name="twitter_link"
                          value={formData.twitter_link}
                          onChange={handleInputChange}
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="youtube_link">YouTube</Label>
                        <Input
                          id="youtube_link"
                          name="youtube_link"
                          value={formData.youtube_link}
                          onChange={handleInputChange}
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Total Points</Label>
                      <div className="rounded-lg bg-primary/10 p-4 text-center">
                        <p className="text-2xl font-bold text-primary">{influencer.total_points}</p>
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