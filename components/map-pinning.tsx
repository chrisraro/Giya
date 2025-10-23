"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Search } from "lucide-react"
import { toast } from "sonner"

interface MapPinningProps {
  initialAddress?: string
  initialLocation?: { lat: number; lng: number }
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  apiKey: string
}

export function MapPinning({ initialAddress, onLocationSelect }: MapPinningProps) {
  const [searchQuery, setSearchQuery] = useState(initialAddress || "")
  
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter an address")
      return
    }
    
    // For now, we'll just pass the address as both address and coordinates
    // In a real implementation, you would use a geocoding service here
    onLocationSelect({
      lat: 0,
      lng: 0,
      address: searchQuery
    })
    
    toast.success("Location set successfully")
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter your business address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>
            Set Location
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Enter your business address above to set your location
        </p>
      </div>
    </div>
  )
}
