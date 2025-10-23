"use client";

import { ReactNode, useState, useRef, useEffect, Fragment } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: "customer" | "business" | "influencer";
  userName: string;
  userEmail?: string;
  userAvatar?: string | null;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

export function DashboardLayout({
  children,
  userRole,
  userName,
  userEmail,
  userAvatar,
  breadcrumbs,
}: DashboardLayoutProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [wave, setWave] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  
  // Set greeting based on time of day
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting("Good morning");
      } else if (hour < 18) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    };

    updateGreeting();
    // Update greeting every minute to keep it fresh
    const interval = setInterval(updateGreeting, 60000);
    
    // Wave animation on initial load
    const waveTimeout = setTimeout(() => {
      setWave(true);
      // Reset wave animation after it completes
      setTimeout(() => setWave(false), 1000);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(waveTimeout);
    };
  }, []);
  
  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
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
  
  const handleSettings = () => {
    router.push(`/dashboard/${userRole}/settings`)
    setIsProfileMenuOpen(false);
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 relative">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  {breadcrumbs.map((crumb, index) => (
                    <Fragment key={index}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem isCurrent={!crumb.href}>
                        {crumb.href ? (
                          <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                        ) : (
                          crumb.label
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
          {/* Profile Avatar and Name */}
          <div className="relative" ref={profileMenuRef}>
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-muted-foreground mt-1">{userEmail}</p>
                )}
              </div>
              <Avatar className="h-10 w-10">
                {userAvatar ? (
                  <AvatarImage src={userAvatar} alt={`${userName}'s profile picture`} />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            
            {/* Custom Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-background border rounded-md shadow-lg z-50">
                <div className="py-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 text-left hover:bg-muted"
                    onClick={handleSettings}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2 text-left hover:bg-muted"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 container-padding-x container mx-auto py-6">
          {/* Greeting Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <span className={wave ? "inline-block animate-wave" : "inline-block"}>👋</span>
              <span className="ml-2">
                {greeting}, {userName}!
              </span>
            </h1>
            <style jsx>{`
              @keyframes wave {
                0% { transform: rotate(0deg); }
                25% { transform: rotate(20deg); }
                50% { transform: rotate(-10deg); }
                75% { transform: rotate(10deg); }
                100% { transform: rotate(0deg); }
              }
              .animate-wave {
                animation: wave 1s ease-in-out;
              }
            `}</style>
          </div>
          
          <div className="flex flex-col gap-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}