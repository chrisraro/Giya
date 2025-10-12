"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      // Get all active channels before signing out
      const channels = supabase.getChannels();
      
      // Unsubscribe from all channels
      if (channels && channels.length > 0) {
        console.log(`[v0] Unsubscribing from ${channels.length} channels before logout`);
        for (const channel of channels) {
          try {
            await supabase.removeChannel(channel);
            console.log(`[v0] Successfully unsubscribed from channel: ${channel.topic}`);
          } catch (error) {
            console.warn(`[v0] Failed to remove channel ${channel.topic}:`, error);
          }
        }
      }
      
      // Sign out from Supabase
      console.log("[v0] Signing out user");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[v0] Logout error:", error);
        toast.error("Failed to logout", {
          description: error.message,
        });
        return;
      }
      
      // Clear any client-side state if needed
      console.log("[v0] Logout successful, redirecting to home");
      
      // Redirect to home page
      router.push("/");
      router.refresh();
      
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("[v0] Unexpected logout error:", error);
      toast.error("Unexpected error during logout", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container-padding-x container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">{userName}</h2>
              {userEmail && <p className="text-sm text-muted-foreground">{userEmail}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/${userRole}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-padding-x container mx-auto py-8">
        <div className="flex flex-col gap-6">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem key={index} isCurrent={!crumb.href}>
                      {crumb.href ? (
                        <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                      ) : (
                        crumb.label
                      )}
                    </BreadcrumbItem>
                  </>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}