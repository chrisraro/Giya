import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface QrCodeCardProps {
  qrCodeData: string
}

export function QrCodeCard({ qrCodeData }: QrCodeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Your QR Code
        </CardTitle>
        <CardDescription>Show this QR code at participating businesses to earn points</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="rounded-lg bg-white p-6">
          <QRCodeSVG value={qrCodeData} size={200} level="H" />
        </div>
        <div className="text-center">
          <p className="font-mono text-sm font-medium text-muted-foreground">{qrCodeData}</p>
        </div>
      </CardContent>
    </Card>
  )
}