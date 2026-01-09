import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Clock, Send } from "lucide-react";
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";
import { Footer1 } from "@/components/pro-blocks/landing-page/footers/footer-1";
import { Logo } from "@/components/pro-blocks/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact Us | Naga Perks by Giya",
  description: "Get in touch with Naga Perks - We're here to help with questions, support, and feedback.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <LpNavbar1 />
      
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <Logo />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight mb-2">Contact Us</h1>
          <p className="text-muted-foreground">Have questions? We're here to help!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Contact Information Cards */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Visit Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold mb-2">Online Creative Solutions</p>
                <p className="text-muted-foreground">
                  Unit 1, J666+8J6 Lendes Inn<br />
                  Almeda Hwy<br />
                  Naga City, 4400 Camarines Sur<br />
                  Philippines
                </p>
                <a
                  href="https://maps.google.com/?q=Unit+1,+J666+8J6+Lendes+Inn,+Almeda+Hwy,+Naga+City,+4400+Camarines+Sur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
                >
                  <MapPin className="h-4 w-4" />
                  Open in Maps
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Call Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">For immediate assistance</p>
                <a
                  href="tel:+639198633539"
                  className="text-2xl font-semibold text-primary hover:underline"
                >
                  0919 863 3539
                </a>
                <p className="text-sm text-muted-foreground mt-4">
                  Available during business hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Send us a message</p>
                <a
                  href="mailto:teamocsph@gmail.com"
                  className="text-lg font-semibold text-primary hover:underline break-all"
                >
                  teamocsph@gmail.com
                </a>
                <p className="text-sm text-muted-foreground mt-4">
                  We typically respond within 24-48 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Website
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Visit our company website</p>
                <a
                  href="https://onlinecreativesolutions.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-primary hover:underline break-all"
                >
                  onlinecreativesolutions.com
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Quick Contact Form / Additional Info */}
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Get in Touch
                </CardTitle>
                <CardDescription>
                  Choose the best way to reach us based on your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">For General Inquiries</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Questions about Naga Perks, how it works, or general information
                  </p>
                  <div className="space-y-2">
                    <Button asChild variant="default" className="w-full">
                      <a href="mailto:teamocsph@gmail.com">
                        <Mail className="mr-2 h-4 w-4" />
                        Email Us
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <a href="tel:+639198633539">
                        <Phone className="mr-2 h-4 w-4" />
                        Call Us
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-2">For Business Partnerships</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Interested in listing your business or becoming a partner
                  </p>
                  <Button asChild variant="secondary" className="w-full">
                    <a href="mailto:teamocsph@gmail.com?subject=Business Partnership Inquiry">
                      <Mail className="mr-2 h-4 w-4" />
                      Business Inquiries
                    </a>
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-2">For Technical Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Issues with the app, account problems, or technical difficulties
                  </p>
                  <Button asChild variant="secondary" className="w-full">
                    <a href="mailto:teamocsph@gmail.com?subject=Technical Support Request">
                      <Mail className="mr-2 h-4 w-4" />
                      Get Support
                    </a>
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-2">For Privacy & Legal</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Privacy concerns, data deletion requests, or legal matters
                  </p>
                  <div className="space-y-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/privacy">
                        View Privacy Policy
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/data-deletion">
                        Data Deletion Request
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-semibold">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-semibold">9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-semibold">Closed</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                    * Email inquiries are monitored 24/7 and will be responded to during business hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">How do I create an account?</h3>
                <p className="text-sm text-muted-foreground">
                  Simply download the Naga Perks app or visit our website and click "Sign Up". Choose your account type (Customer, Business, or Influencer) and follow the registration process.
                </p>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-2">How do I earn and redeem points?</h3>
                <p className="text-sm text-muted-foreground">
                  Shop at participating businesses and scan your customer QR code at checkout. Points are automatically added to your account and can be redeemed for rewards at the same or other participating businesses.
                </p>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-2">How can I list my business?</h3>
                <p className="text-sm text-muted-foreground">
                  Register for a business account, complete your business profile, and our team will review your application. Once approved, you can start creating deals and rewards for customers.
                </p>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-2">What if I need to delete my data?</h3>
                <p className="text-sm text-muted-foreground">
                  Visit our <Link href="/data-deletion" className="text-primary hover:underline">Data Deletion</Link> page for instructions on how to request data deletion in compliance with privacy regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info Summary */}
        <div className="bg-muted p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Contact Information Summary</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-sm text-muted-foreground mb-1">Company</p>
              <p className="font-medium">Online Creative Solutions</p>
            </div>
            <div>
              <p className="font-semibold text-sm text-muted-foreground mb-1">Phone</p>
              <p className="font-medium">
                <a href="tel:+639198633539" className="text-primary hover:underline">
                  0919 863 3539
                </a>
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium break-all">
                <a href="mailto:teamocsph@gmail.com" className="text-primary hover:underline">
                  teamocsph@gmail.com
                </a>
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm text-muted-foreground mb-1">Website</p>
              <p className="font-medium">
                <a 
                  href="https://onlinecreativesolutions.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  onlinecreativesolutions.com
                </a>
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="font-semibold text-sm text-muted-foreground mb-1">Address</p>
              <p className="font-medium">
                Unit 1, J666+8J6 Lendes Inn, Almeda Hwy, Naga City, 4400 Camarines Sur, Philippines
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer1 />
    </div>
  );
}
