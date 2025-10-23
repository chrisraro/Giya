"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  Gift, 
  TrendingUp, 
  Settings, 
  QrCode, 
  Users, 
  LayoutDashboard, 
  Tag, 
  Wallet,
  BarChart3,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Image from "next/image"

interface SidebarProps {
  userRole: "customer" | "business" | "influencer"
  userName: string
  userEmail?: string
  userAvatar?: string | null
  className?: string
}

export function Sidebar({ 
  userRole, 
  userName, 
  userEmail, 
  userAvatar,
  className 
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      setIsOpen(false)
    }
  }, [pathname, isMobile, isOpen])

  const handleLogout = async () => {
    try {
      // Get all active channels before signing out
      const channels = supabase.getChannels()
      
      // Unsubscribe from all channels
      if (channels && channels.length > 0) {
        console.log(`[v0] Unsubscribing from ${channels.length} channels before logout`)
        for (const channel of channels) {
          try {
            await supabase.removeChannel(channel)
            console.log(`[v0] Successfully unsubscribed from channel: ${channel.topic}`)
          } catch (error) {
            console.warn(`[v0] Failed to remove channel ${channel.topic}:`, error)
          }
        }
      }
      
      // Sign out from Supabase with proper scope
      console.log("[v0] Signing out user")
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      
      if (error) {
        console.error("[v0] Logout error:", error)
        toast.error("Failed to logout", {
          description: error.message,
        })
        return
      }
      
      // Clear any client-side state if needed
      console.log("[v0] Logout successful")
      toast.success("Logged out successfully")
      
      // Redirect to home page
      window.location.href = "/"
    } catch (error) {
      console.error("[v0] Unexpected logout error:", error)
      toast.error("Unexpected error during logout", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      })
    }
  }

  const customerItems = [
    {
      title: "Overview",
      href: "/dashboard/customer",
      icon: Home,
    },
    {
      title: "Rewards",
      href: "/dashboard/customer/rewards",
      icon: Gift,
    },
    {
      title: "Discover",
      href: "/",
      icon: TrendingUp,
    },
    {
      title: "Settings",
      href: "/dashboard/customer/settings",
      icon: Settings,
    },
  ]

  const businessItems = [
    {
      title: "Overview",
      href: "/dashboard/business",
      icon: LayoutDashboard,
    },
    {
      title: "Discounts",
      href: "/dashboard/business/discounts",
      icon: Tag,
    },
    {
      title: "Exclusive Offers",
      href: "/dashboard/business/exclusive-offers",
      icon: Gift,
    },
    {
      title: "Rewards",
      href: "/dashboard/business/rewards",
      icon: Gift,
    },
    {
      title: "Transactions",
      href: "/dashboard/business/transactions",
      icon: Wallet,
    },
    {
      title: "Settings",
      href: "/dashboard/business/settings",
      icon: Settings,
    },
  ]

  const influencerItems = [
    {
      title: "Overview",
      href: "/dashboard/influencer",
      icon: BarChart3,
    },
    {
      title: "Affiliates",
      href: "/dashboard/influencer/affiliates",
      icon: Users,
    },
    {
      title: "Settings",
      href: "/dashboard/influencer/settings",
      icon: Settings,
    },
  ]

  const navItems = {
    customer: customerItems,
    business: businessItems,
    influencer: influencerItems,
  }

  const currentNavItems = navItems[userRole]

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Mobile sidebar overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static md:inset-0",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <Link href={`/dashboard/${userRole}`} className="flex items-center gap-2">
                <div className="relative h-8 w-8">
                  <Image 
                    src="/giya-logo.png" 
                    alt="Giya" 
                    fill 
                    className="object-contain" 
                  />
                </div>
                <span className="font-semibold text-lg">Giya</span>
              </Link>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* User profile */}
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden">
                {userAvatar ? (
                  <Image 
                    src={userAvatar} 
                    alt={`${userName}'s profile`} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-muted rounded-full w-full h-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{userName}</p>
                {userEmail && (
                  <p className="text-sm text-sidebar-foreground/70 truncate">{userEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {currentNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3",
                          isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Button>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}