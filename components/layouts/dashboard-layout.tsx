"use client";

import { ReactNode } from "react";
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
  return (
    <SidebarProvider>
      <AppSidebar 
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <>
                    <BreadcrumbSeparator key={`sep-${index}`} />
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
        </header>
        <main className="flex-1 container-padding-x container mx-auto py-6">
          <div className="flex flex-col gap-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}