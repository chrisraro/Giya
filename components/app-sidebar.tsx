"use client"

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
  Package,
  Percent
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface AppSidebarProps {
  userRole: "customer" | "business"
  userName: string
  userEmail?: string
  userAvatar?: string | null
}

export function AppSidebar({ 
  userRole, 
  userName, 
  userEmail, 
  userAvatar 
}: AppSidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()

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
      url: "/dashboard/customer",
      icon: Home,
    },
    {
      title: "Rewards",
      url: "/dashboard/customer/rewards",
      icon: Gift,
    },
    {
      title: "Transactions",
      url: "/dashboard/customer/transactions",
      icon: Wallet,
    },
    {
      title: "Discover",
      url: "/",
      icon: TrendingUp,
    },
    {
      title: "Settings",
      url: "/dashboard/customer/settings",
      icon: Settings,
    },
  ]

  const businessItems = [
    {
      title: "Overview",
      url: "/dashboard/business",
      icon: LayoutDashboard,
    },
    {
      title: "Menu",
      url: "/dashboard/business/menu",
      icon: Package,
    },
    {
      title: "Deals",
      url: "/dashboard/business/deals",
      icon: Percent,
    },
    {
      title: "Rewards",
      url: "/dashboard/business/rewards",
      icon: Gift,
    },
    {
      title: "Transactions",
      url: "/dashboard/business/transactions",
      icon: Wallet,
    },
    {
      title: "Settings",
      url: "/dashboard/business/settings",
      icon: Settings,
    },
  ]

  // Removed influencer navigation items - feature disabled

  const navItems = {
    customer: customerItems,
    business: businessItems,
  }

  const currentNavItems = navItems[userRole]

  return (
    <Sidebar>
      <SidebarHeader className="px-3 md:px-4 py-3 md:py-4">
        <div className="flex items-center gap-2">
          <div className="relative h-7 w-7 md:h-8 md:w-8">
            <Image 
              src="/giya-logo.png" 
              alt="Giya" 
              fill 
              className="object-contain" 
            />
          </div>
          <span className="font-semibold text-base md:text-lg">Giya</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3 py-3 md:py-4">
          <div className="relative h-9 w-9 md:h-10 md:w-10 rounded-full overflow-hidden flex-shrink-0">
            {userAvatar ? (
              <Image 
                src={userAvatar} 
                alt={`${userName}'s profile`} 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="bg-muted rounded-full w-full h-full flex items-center justify-center">
                <User className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm md:text-base">{userName}</p>
            {userEmail && (
              <p className="text-xs md:text-sm text-sidebar-foreground/70 truncate">{userEmail}</p>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs md:text-sm px-3 md:px-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {currentNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-11 md:h-10 px-3 md:px-4 text-sm md:text-base"
                    >
                      <Link href={item.url}>
                        <Icon className="h-5 w-5 md:h-4 md:w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 md:px-3 py-2 md:py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="h-11 md:h-10 px-3 md:px-4 text-sm md:text-base"
            >
              <LogOut className="h-5 w-5 md:h-4 md:w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}