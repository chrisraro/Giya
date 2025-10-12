import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, Gift, Tag } from "lucide-react"
import Link from "next/link"

interface QuickActionsProps {
  onShowQRDialog: () => void
}

export function QuickActions({ onShowQRDialog }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Button onClick={onShowQRDialog} size="lg" className="h-auto flex-col gap-2 py-6">
          <QrCode className="h-8 w-8" />
          <span>Show My QR Code</span>
        </Button>
        <Link href="/dashboard/customer/rewards">
          <Button variant="outline" size="lg" className="h-auto w-full flex-col gap-2 py-6 bg-transparent">
            <Gift className="h-8 w-8" />
            <span>View Rewards</span>
          </Button>
        </Link>
        <Link href="/dashboard/customer/discounts">
          <Button variant="outline" size="lg" className="h-auto w-full flex-col gap-2 py-6 bg-transparent">
            <Tag className="h-8 w-8" />
            <span>View Discounts</span>
          </Button>
        </Link>
        <Link href="/dashboard/customer/exclusive-offers">
          <Button variant="outline" size="lg" className="h-auto w-full flex-col gap-2 py-6 bg-transparent">
            <Gift className="h-8 w-8" />
            <span>View Exclusive Offers</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}