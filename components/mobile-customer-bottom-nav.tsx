"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  Wallet, 
  QrCode, 
  Search,
  Ticket
} from "lucide-react"
import { cn } from "@/lib/utils"
import { UnifiedScanner } from "@/components/unified-scanner"

export function MobileCustomerBottomNav() {
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
        "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="relative h-16 flex items-center justify-between px-4 py-3">
          {/* Discover/Home - Left */}
          <div className="flex flex-col items-center gap-1">
            <Link href="/dashboard/customer">
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl transition-all duration-200",
                  isActive("/dashboard/customer") 
                    ? "text-primary scale-105" 
                    : "text-muted-foreground hover:bg-transparent"
                )}
              >
                <Search className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive("/dashboard/customer") ? "text-primary" : "text-muted-foreground"
                )} />
              </Button>
            </Link>
            <span className={cn(
              "text-xs font-medium transition-all duration-200",
              isActive("/dashboard/customer") 
                ? "text-primary scale-105" 
                : "text-muted-foreground"
            )}>
              Discover
            </span>
          </div>
          
          {/* QR Scanner - Center */}
          <div className="flex flex-col items-center gap-1">
            <Button
              onClick={() => setShowScanner(true)}
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/90 shadow-lg hover:from-primary/90 hover:to-primary transition-all duration-300 flex items-center justify-center group"
            >
              <QrCode className="h-6 w-6 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground">Scan</span>
          </div>
          
          {/* Transactions - Right */}
          <div className="flex flex-col items-center gap-1">
            <Link href="/dashboard/customer/transactions">
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl transition-all duration-200",
                  isActive("/dashboard/customer/transactions") 
                    ? "text-primary scale-105" 
                    : "text-muted-foreground hover:bg-transparent"
                )}
              >
                <Wallet className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive("/dashboard/customer/transactions") ? "text-primary" : "text-muted-foreground"
                )} />
              </Button>
            </Link>
            <span className={cn(
              "text-xs font-medium transition-all duration-200",
              isActive("/dashboard/customer/transactions") 
                ? "text-primary scale-105" 
                : "text-muted-foreground"
            )}>
              Transactions
            </span>
          </div>
        </div>
      </div>
      
      <UnifiedScanner 
        open={showScanner}
        onOpenChange={setShowScanner}
        userRole="customer"
      />
    </>
  )
}