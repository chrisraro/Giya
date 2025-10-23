import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Link2, Check } from "lucide-react"

interface Business {
  id: string
  business_name: string
  business_category: string
  profile_pic_url: string | null
}

interface AffiliateLink {
  business_id: string
}

interface GenerateLinksTabProps {
  businesses: Business[]
  affiliateLinks: AffiliateLink[]
  onGenerateLink: (businessId: string) => void
}

export function GenerateLinksTab({ 
  businesses, 
  affiliateLinks, 
  onGenerateLink 
}: GenerateLinksTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Affiliate Links</CardTitle>
        <CardDescription>Create affiliate links for businesses to promote</CardDescription>
      </CardHeader>
      <CardContent>
        {businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No businesses available yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {businesses.map((business) => (
              <Card key={business.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={business.profile_pic_url || undefined} alt={business.business_name} />
                      <AvatarFallback>{business.business_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{business.business_name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {business.business_category}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => onGenerateLink(business.id)}
                    className="w-full"
                    size="sm"
                    disabled={affiliateLinks.some((link) => link.business_id === business.id)}
                  >
                    {affiliateLinks.some((link) => link.business_id === business.id) ? (
                      <>
                        <Check className="h-4 w-4" />
                        Link Created
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Generate Link
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}