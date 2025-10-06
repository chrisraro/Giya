import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1"
import { HeroSection2 } from "@/components/pro-blocks/landing-page/hero-sections/hero-section-2"
import { Footer1 } from "@/components/pro-blocks/landing-page/footers/footer-1"
import { BusinessDiscovery } from "@/components/business-discovery"

export default function Page() {
  return (
    <main>
      <LpNavbar1 />
      <HeroSection2 />
      <BusinessDiscovery />
      <Footer1 />
    </main>
  )
}
