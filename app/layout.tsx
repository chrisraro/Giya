import type React from "react"
import type { Metadata, Viewport } from "next"
import { Onest } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { DomErrorBoundary } from "@/components/shared/dom-error-boundary"
import UniversalForceRefreshFix from "@/components/shared/universal-force-refresh-fix"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { InstallPrompt } from "@/components/install-prompt"
import { OfflineIndicator } from "@/components/offline-indicator"
import { PostHogProvider } from "@/components/PostHogProvider"

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Naga Perks by Giya - Hyperlocal Discovery & Rewards",
  description: "Naga Perks powered by Giya is a hyperlocal discovery and privilege app that unlocks new experiences and perks for locals in Naga City.",
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/Naga Perks Logo.png',
    apple: '/Naga Perks Logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Naga Perks',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Naga Perks by Giya',
    title: 'Naga Perks by Giya - Hyperlocal Discovery & Rewards',
    description: 'Discover local businesses, earn rewards, and enjoy exclusive privileges in Naga City',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Naga Perks by Giya',
    description: 'Discover local businesses, earn rewards, and enjoy exclusive privileges in Naga City',
  },
}

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Naga Perks" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Naga Perks" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/Naga Perks Logo.png" />
      </head>
      <body className={`${onest.variable} relative antialiased`}>
        <PostHogProvider>
          <DomErrorBoundary>
            <ServiceWorkerRegistration />
            <InstallPrompt />
            <OfflineIndicator />
            <UniversalForceRefreshFix />
            {children}
            <Toaster />
          </DomErrorBoundary>
        </PostHogProvider>
      </body>
    </html>
  )
}