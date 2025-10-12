import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion History</CardTitle>
        <CardDescription>Users who signed up through your links</CardDescription>
      </CardHeader>
      <CardContent>
        {conversions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No conversions yet</p>
            <p className="text-xs text-muted-foreground">Share your links to start earning!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversions.map((conversion) => (
              <div
                key={conversion.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{conversion.customers.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(conversion.converted_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant="default">{conversion.points_earned} pts</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}