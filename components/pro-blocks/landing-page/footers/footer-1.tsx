"use client"

import { Logo } from "@/components/pro-blocks/logo"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function Footer1() {
  return (
    <footer className="bg-background section-padding-y" role="contentinfo" aria-label="Site footer">
      <div className="container-padding-x container mx-auto flex flex-col gap-12 lg:gap-16">
        {/* Top Section */}
        <div className="flex w-full flex-col items-center gap-12 text-center">
          {/* Logo Section */}
          <Link href="/" aria-label="Go to homepage">
            <Logo />
          </Link>

          <nav className="flex flex-col items-center gap-6 text-sm md:flex-row md:gap-8" aria-label="Footer navigation">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/#businesses" className="text-muted-foreground hover:text-foreground transition-colors">
              Discover Businesses
            </Link>
            <Link href="/auth/signup" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign Up
            </Link>
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
          </nav>
        </div>

        {/* Section Divider */}
        <Separator role="presentation" />

        {/* Bottom Section */}
        <div className="flex w-full flex-col-reverse items-center gap-12 text-sm lg:flex-row lg:justify-between lg:gap-6">
          <p className="text-muted-foreground text-center lg:text-left">
            © {new Date().getFullYear()} Naga Perks by Giya. All rights reserved.
          </p>

          {/* Legal Navigation */}
          <nav className="flex flex-col items-center gap-6 text-sm md:flex-row md:gap-8" aria-label="Legal links">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}