import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Link2, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface AffiliateLink {
  id: string
  business_id: string
  unique_code: string
  created_at: string
  businesses: {
    business_name: string
    profile_pic_url: string | null
  }
}

interface MyLinksTabProps {
  affiliateLinks: AffiliateLink[]
  copiedCode: string | null
  onCopyCode: (code: string) => void
  onCopyFullLink: (code: string) => void
}

export function MyLinksTab({ 
  affiliateLinks, 
  copiedCode, 
  onCopyCode, 
  onCopyFullLink 
}: MyLinksTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Affiliate Links</CardTitle>
        <CardDescription>Your generated affiliate links</CardDescription>
      </CardHeader>
      <CardContent>
        {affiliateLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Link2 className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No affiliate links yet</p>
            <p className="text-xs text-muted-foreground">Generate links to start earning!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {affiliateLinks.map((link) => (
              <Card key={link.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={link.businesses.profile_pic_url || undefined} alt={link.businesses.business_name} />
                      <AvatarFallback>{link.businesses.business_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{link.businesses.business_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(link.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-md p-3 mb-3">
                    <p className="text-sm font-mono break-all">
                      {window.location.origin}/auth/signup?ref={link.unique_code}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopyCode(link.unique_code)}
                      className="flex-1"
                    >
                      {copiedCode === link.unique_code ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied Code
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onCopyFullLink(link.unique_code)}
                      className="flex-1"
                    >
                      {copiedCode === `full-${link.unique_code}` ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied Link
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}