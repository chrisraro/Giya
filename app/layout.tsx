import type React from "react"
import type { Metadata } from "next"
import { Onest } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { DomErrorBoundary } from "@/components/shared/dom-error-boundary"
import UniversalForceRefreshFix from "@/components/shared/universal-force-refresh-fix"

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Naga Perks by Giya - Hyperlocal Discovery & Rewards",
  description: "Naga Perks powered by Giya is a hyperlocal discovery and privilege app that unlocks new experiences and perks for locals in Naga City.",
  generator: 'v0.app',
  icons: {
    icon: '/Naga Perks Logo.png',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${onest.variable} relative antialiased`}>
        <DomErrorBoundary>
          <UniversalForceRefreshFix />
          {children}
          <Toaster />
        </DomErrorBoundary>
      </body>
    </html>
  )
}