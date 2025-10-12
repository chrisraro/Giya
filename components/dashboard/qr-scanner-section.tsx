import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, Scan, Gift, Tag } from "lucide-react"
import Link from "next/link"

interface QrScannerSectionProps {
  pointsPerCurrency: number
  onOpenScanner: () => void
}

export function QrScannerSection({ pointsPerCurrency, onOpenScanner }: QrScannerSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scan Customer QR Code
        </CardTitle>
        <CardDescription>Scan a customer's QR code to award points or validate redemptions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onOpenScanner} size="lg" className="w-full md:w-auto">
          <Scan className="mr-2 h-5 w-5" />
          Open QR Scanner
        </Button>
        <p className="text-sm text-muted-foreground">
          Points configuration: 1 point per ₱{pointsPerCurrency}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/dashboard/business/rewards">
            <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
              <Gift className="mr-2 h-5 w-5" />
              Manage Rewards
            </Button>
          </Link>
          <Link href="/dashboard/business/discounts">
            <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
              <Tag className="mr-2 h-5 w-5" />
              Manage Discounts
            </Button>
          </Link>
          <Link href="/dashboard/business/exclusive-offers">
            <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
              <Gift className="mr-2 h-5 w-5" />
              Manage Exclusive Offers
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}