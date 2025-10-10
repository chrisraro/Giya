"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Gift, TrendingUp, Settings, LogOut, Menu, QrCode, Users, LayoutDashboard, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

interface DashboardNavProps {
  userRole: "customer" | "business" | "influencer"
  userName: string
  userAvatar?: string | null
}

export function DashboardNav({ userRole, userName, userAvatar }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
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
      title: "Redemption",
      href: "/dashboard/business/validate-redemption",
      icon: QrCode,
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
      icon: Home,
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
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container-padding-x container mx-auto flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={`/dashboard/${userRole}`} className="flex items-center gap-2">
          <Image src="/giya-logo.png" alt="Giya" width={40} height={40} className="object-contain" />
          <span className="font-semibold text-lg hidden sm:inline">Giya</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {currentNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button variant={isActive ? "default" : "ghost"} size="sm" className="gap-2">
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* User Menu - simplified for now */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}