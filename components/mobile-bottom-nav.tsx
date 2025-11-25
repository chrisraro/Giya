"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  Wallet, 
  QrCode, 
  BarChart3,
  Ticket
} from "lucide-react"
import { cn } from "@/lib/utils"
import { UnifiedScanner } from "@/components/unified-scanner"

interface MobileBottomNavProps {
  onQrScan?: (data: string) => void // Optional callback for QR scan results
}

export function MobileBottomNav({ onQrScan }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  
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
    <>
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border transition-transform duration-300 safe-area-bottom",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}>
      <div className="relative h-20 flex items-center justify-center px-4 py-2">
        {/* Overview/Home - Left */}
        <div className="absolute left-4 flex flex-col items-center gap-0.5 touch-target">
          <Link href="/dashboard/business" className="flex flex-col items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(
                "h-12 w-12 rounded-xl transition-all duration-200",
                isActive("/dashboard/business") 
                  ? "text-primary scale-105 bg-primary/10" 
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Home className={cn(
                "h-6 w-6 transition-all duration-200",
                isActive("/dashboard/business") ? "text-primary" : "text-muted-foreground"
              )} />
            </Button>
            <span className={cn(
              "text-[10px] font-medium transition-all duration-200 leading-tight",
              isActive("/dashboard/business") 
                ? "text-primary scale-105" 
                : "text-muted-foreground"
            )}>
              Home
            </span>
          </Link>
        </div>
        
        {/* QR Scanner - Center (prominent) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 touch-target">
          <Button
            onClick={() => setShowScanner(true)}
            size="icon"
            className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/90 shadow-lg hover:from-primary/90 hover:to-primary transition-all duration-300 -translate-y-6 flex items-center justify-center group z-10 active:scale-95"
          >
            <QrCode className="h-7 w-7 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
          </Button>
        </div>
        
        {/* Transactions - Right */}
        <div className="absolute right-4 flex flex-col items-center gap-0.5 touch-target">
          <Link href="/dashboard/business/transactions" className="flex flex-col items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(
                "h-12 w-12 rounded-xl transition-all duration-200",
                isActive("/dashboard/business/transactions") 
                  ? "text-primary scale-105 bg-primary/10" 
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Wallet className={cn(
                "h-6 w-6 transition-all duration-200",
                isActive("/dashboard/business/transactions") ? "text-primary" : "text-muted-foreground"
              )} />
            </Button>
            <span className={cn(
              "text-[10px] font-medium transition-all duration-200 leading-tight",
              isActive("/dashboard/business/transactions") 
                ? "text-primary scale-105" 
                : "text-muted-foreground"
            )}>
              Transactions
            </span>
          </Link>
        </div>
      </div>
      <style jsx>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
      </div>
      
      <UnifiedScanner 
        open={showScanner}
        onOpenChange={setShowScanner}
        userRole="business"
        onBusinessScan={onQrScan}
      />
    </>
  )
}