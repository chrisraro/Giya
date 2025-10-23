"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  Wallet, 
  QrCode, 
  BarChart3 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileBottomNavProps {
  onQrScan: () => void
}

export function MobileBottomNav({ onQrScan }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  
  // Hide bottom nav when scrolling down, show when scrolling up
  useEffect(() => {
    let lastScrollY = window.scrollY
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(lastScrollY > currentScrollY || currentScrollY < 10)
      lastScrollY = currentScrollY
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t transition-transform duration-300",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Overview/Home - Left */}
        <Link href="/dashboard/business" className="flex flex-col items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full",
              isActive("/dashboard/business") && "bg-primary/10"
            )}
          >
            <Home className={cn(
              "h-5 w-5",
              isActive("/dashboard/business") ? "text-primary" : "text-muted-foreground"
            )} />
          </Button>
          <span className={cn(
            "text-xs",
            isActive("/dashboard/business") ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            Home
          </span>
        </Link>
        
        {/* QR Scanner - Center (prominent) */}
        <Button
          onClick={onQrScan}
          className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 -translate-y-4 flex items-center justify-center"
        >
          <QrCode className="h-6 w-6 text-primary-foreground" />
        </Button>
        
        {/* Transactions - Right */}
        <Link href="/dashboard/business/transactions" className="flex flex-col items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full",
              isActive("/dashboard/business/transactions") && "bg-primary/10"
            )}
          >
            <Wallet className={cn(
              "h-5 w-5",
              isActive("/dashboard/business/transactions") ? "text-primary" : "text-muted-foreground"
            )} />
          </Button>
          <span className={cn(
            "text-xs",
            isActive("/dashboard/business/transactions") ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            Transactions
          </span>
        </Link>
      </div>
    </div>
  )
}