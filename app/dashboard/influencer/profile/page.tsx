// TEMPORARILY DISABLED - INFLUENCER FEATURE COMING SOON
// This page will be re-enabled in a future update

"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export default function InfluencerProfilePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect influencer users to home page
    router.push("/")
  }, [router])

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Influencer Hub Coming Soon</CardTitle>
          <CardDescription>
            The Influencer Hub feature is currently under development and will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Redirecting you to the homepage...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
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