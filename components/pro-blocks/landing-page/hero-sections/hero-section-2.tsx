"use client"

import { Button } from "@/components/ui/button"
import { Check, ArrowRight, MapPin } from "lucide-react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Tagline } from "@/components/pro-blocks/landing-page/tagline"
import Image from "next/image"
import Link from "next/link"

export function HeroSection2() {
  return (
    <section className="bg-secondary section-padding-y" aria-labelledby="hero-heading">
      <div className="container-padding-x container mx-auto flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
        {/* Left Column */}
        <div className="flex flex-1 flex-col gap-6 lg:gap-8">
          {/* Section Title */}
          <div className="section-title-gap-xl flex flex-col">
            <Tagline>Giya - Hyperlocal Discovery</Tagline>
            <h1 id="hero-heading" className="heading-xl">
              Unlock new experiences and perks in <span className="text-primary">Naga City</span>
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg">
              Discover local businesses, earn rewards, and enjoy exclusive privileges with Giya's QR-based loyalty
              system right here in Naga City
            </p>
          </div>

          <div className="flex flex-col gap-2 md:gap-3">
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <Check className="text-primary h-5 w-5" />
              </div>
              <span className="text-card-foreground text-base leading-6 font-medium">
                Earn points with every purchase in Naga City
              </span>
            </div>

            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <Check className="text-primary h-5 w-5" />
              </div>
              <span className="text-card-foreground text-base leading-6 font-medium">Redeem exclusive rewards from local businesses</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                <Check className="text-primary h-5 w-5" />
              </div>
              <span className="text-card-foreground text-base leading-6 font-medium">
                Discover the best of Naga City with personalized recommendations
              </span>
            </div>
          </div>

          {/* Location Highlight */}
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
            <MapPin className="text-primary h-5 w-5" />
            <span className="text-primary font-medium">Now serving Naga City and surrounding areas</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="#businesses">
              <Button variant="ghost" size="lg">
                Discover Businesses
                <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full flex-1">
          <AspectRatio ratio={1 / 1}>
            <Image
              src="/hero.jpg"
              alt="Giya - Hyperlocal discovery and privilege app in Naga City"
              fill
              priority
              className="h-full w-full rounded-xl object-cover"
            />
          </AspectRatio>
        </div>
      </div>
    </section>
  )
}