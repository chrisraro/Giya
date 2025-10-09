import type React from "react"
import type { Metadata } from "next"
import { Onest } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Giya - Hyperlocal Discovery & Privilege App",
  description: "Giya is a hyperlocal discovery and privilege app that unlocks new experiences and perks for locals.",
  generator: 'v0.app',
  icons: {
    icon: '/giya-logo.png',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={`${onest.variable} relative antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </>
  )
}