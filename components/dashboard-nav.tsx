"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, Gift, TrendingUp, Settings, LogOut, Menu, QrCode, Users } from "lucide-react"
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

  const navItems = {
    customer: [
      { href: "/dashboard/customer", label: "Dashboard", icon: Home },
      { href: "/dashboard/customer/rewards", label: "Rewards", icon: Gift },
      { href: "/", label: "Discover", icon: TrendingUp },
      { href: "/dashboard/customer/settings", label: "Settings", icon: Settings },
    ],
    business: [
      { href: "/dashboard/business", label: "Dashboard", icon: Home },
      { href: "/dashboard/business/rewards", label: "Manage Rewards", icon: Gift },
      { href: "/dashboard/business/validate-redemption", label: "Validate QR", icon: QrCode },
      { href: "/dashboard/business/settings", label: "Settings", icon: Settings },
    ],
    influencer: [
      { href: "/dashboard/influencer", label: "Dashboard", icon: Home },
      { href: "/dashboard/influencer/affiliates", label: "Affiliates", icon: Users },
      { href: "/dashboard/influencer/settings", label: "Settings", icon: Settings },
    ],
  }

  const currentNavItems = navItems[userRole]

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container-padding-x container mx-auto flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={`/dashboard/${userRole}`} className="flex items-center gap-2">
          <Image src="/giya-logo.jpg" alt="Giya" width={40} height={40} className="object-contain" />
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
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userAvatar || undefined} />
                  <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole} Account</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/${userRole}/settings`} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={userAvatar || undefined} />
                    <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                  </div>
                </div>
                <nav className="flex flex-col gap-2">
                  {currentNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start gap-2">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    )
                  })}
                </nav>
                <Button variant="destructive" onClick={handleLogout} className="mt-auto gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
