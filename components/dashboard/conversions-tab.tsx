import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, User } from "lucide-react"
import Link from "next/link"

interface Conversion {
  id: string
  converted_at: string
  customers: {
    full_name: string
  }
  points_earned: number
}

interface ConversionsTabProps {
  conversions: Conversion[]
}

export function ConversionsTab({ conversions }: ConversionsTabProps) {
  if (conversions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No conversions yet</h3>
          <p className="mb-4 text-muted-foreground">
            Share your affiliate links to start earning points from referrals.
          </p>
          <Button asChild>
            <Link href="#generate">Generate Links</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {conversions.map((conversion) => (
            <div key={conversion.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {conversion.customers?.full_name || "New Customer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Signed up on {new Date(conversion.converted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">+{conversion.points_earned} pts</p>
                  <p className="text-xs text-muted-foreground">
                    {conversion.points_earned >= 10 ? "Referral bonus" : "Transaction bonus"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}