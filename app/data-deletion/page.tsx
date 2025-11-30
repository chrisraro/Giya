import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trash2, Shield, AlertCircle } from "lucide-react";
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";
import { Footer1 } from "@/components/pro-blocks/landing-page/footers/footer-1";
import { Logo } from "@/components/pro-blocks/logo";

export const metadata: Metadata = {
  title: "Data Deletion Instructions | Naga Perks by Giya",
  description: "Learn how to request deletion of your personal data from Naga Perks.",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background">
      <LpNavbar1 />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
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
          
          <h1 className="text-4xl font-bold tracking-tight mb-2">Data Deletion Instructions</h1>
          <p className="text-muted-foreground">Last Updated: November 30, 2025</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-6 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2 mt-0">Your Privacy Rights</h2>
                  <p className="text-blue-800 dark:text-blue-200 mb-0">
                    At Naga Perks by Giya, we respect your right to privacy and data control. You have the right to request deletion of your personal data at any time. This page explains how to submit a data deletion request and what to expect.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Trash2 className="h-6 w-6" />
              How to Request Data Deletion
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Option 1: Delete Account from App Settings</h3>
                <p>If you have access to your Naga Perks account, you can delete your account directly:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Log in to your Naga Perks account</li>
                  <li>Go to <strong>Settings</strong> or <strong>Profile</strong></li>
                  <li>Scroll down to <strong>Account Management</strong></li>
                  <li>Click on <strong>"Delete Account"</strong></li>
                  <li>Confirm your decision when prompted</li>
                </ol>
                <p className="mt-3 text-sm text-muted-foreground">
                  ⚠️ This action is permanent and cannot be undone. All your points, rewards, and transaction history will be deleted.
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-3">Option 2: Contact Us Directly</h3>
                <p>If you cannot access your account or prefer to contact us directly, you can submit a data deletion request:</p>
                
                <div className="bg-muted p-6 rounded-lg mt-4 space-y-3">
                  <div>
                    <p className="font-semibold mb-2">Via Email:</p>
                    <p>Send your deletion request to: <a href="mailto:teamocsph@gmail.com" className="text-primary hover:underline font-medium">teamocsph@gmail.com</a></p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="font-semibold mb-2">Via Phone:</p>
                    <p>Call us at: <a href="tel:+639198633539" className="text-primary hover:underline font-medium">0919 863 3539</a></p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="font-semibold mb-2">Via Mail:</p>
                    <p className="text-sm">
                      Online Creative Solutions<br />
                      Unit 1, J666+8J6 Lendes Inn<br />
                      Almeda Hwy, Naga City<br />
                      4400 Camarines Sur, Philippines
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-sm">Required Information</p>
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm mt-1">
                        Please include the following in your deletion request:
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200 mt-2 ml-2 space-y-1">
                        <li>Your full name</li>
                        <li>Email address associated with your account</li>
                        <li>Phone number (if applicable)</li>
                        <li>Facebook/Google account email (if you signed up via social login)</li>
                        <li>Subject line: "Data Deletion Request"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">What Data Will Be Deleted</h2>
            <p>When you request data deletion, the following information will be permanently removed from our systems:</p>
            <ul className="space-y-2 mt-3">
              <li><strong>Account Information:</strong> Name, email, phone number, profile picture, password</li>
              <li><strong>Transaction History:</strong> Points earned, rewards redeemed, deals purchased, receipts</li>
              <li><strong>User-Generated Content:</strong> Reviews, ratings, comments, photos</li>
              <li><strong>Location Data:</strong> Saved addresses, location history, check-ins</li>
              <li><strong>Activity Data:</strong> App usage, browsing history, search queries</li>
              <li><strong>Social Media Links:</strong> Facebook/Google account connections</li>
              <li><strong>Communication Records:</strong> Support tickets, messages, notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Retention Exceptions</h2>
            <p>Some data may be retained for legal or legitimate business purposes, including:</p>
            <ul className="space-y-2 mt-3">
              <li><strong>Legal Compliance:</strong> Transaction records required by law (retained for 7 years)</li>
              <li><strong>Fraud Prevention:</strong> Data necessary to prevent fraud or abuse</li>
              <li><strong>Pending Disputes:</strong> Information related to ongoing legal matters or disputes</li>
              <li><strong>Aggregated Data:</strong> Anonymized, aggregated analytics data that cannot identify you</li>
              <li><strong>Business Records:</strong> Financial records for accounting and tax purposes</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              We will only retain the minimum necessary data for these purposes and will delete it once the retention period expires.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Timeline and Process</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">1</div>
                <div>
                  <h3 className="font-semibold mb-1">Request Received</h3>
                  <p className="text-sm text-muted-foreground">We acknowledge your deletion request within 48 hours via email.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">2</div>
                <div>
                  <h3 className="font-semibold mb-1">Identity Verification</h3>
                  <p className="text-sm text-muted-foreground">We may ask for additional information to verify your identity and protect your account security.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">3</div>
                <div>
                  <h3 className="font-semibold mb-1">Data Deletion</h3>
                  <p className="text-sm text-muted-foreground">Your data is permanently deleted from our active systems within 30 days of verification.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">4</div>
                <div>
                  <h3 className="font-semibold mb-1">Confirmation</h3>
                  <p className="text-sm text-muted-foreground">You receive a final confirmation email once the deletion process is complete.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Facebook Login Data Deletion</h2>
            <p>
              If you signed up for Naga Perks using Facebook Login, you can also manage your data through Facebook:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4 mt-3">
              <li>Go to your Facebook <strong>Settings & Privacy</strong></li>
              <li>Click on <strong>Settings</strong></li>
              <li>Navigate to <strong>Apps and Websites</strong></li>
              <li>Find <strong>Naga Perks by Giya</strong> in the list</li>
              <li>Click <strong>Remove</strong> to revoke app access</li>
            </ol>
            <p className="mt-3 text-sm">
              Note: Removing the app from Facebook only revokes access permissions. To delete your Naga Perks account data, you still need to submit a deletion request through the methods above.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Questions or Concerns?</h2>
            <p>
              If you have questions about data deletion or need assistance, please don't hesitate to contact our privacy team:
            </p>
            <div className="bg-muted p-6 rounded-lg mt-4">
              <p className="font-semibold">Online Creative Solutions - Privacy Team</p>
              <p className="mt-2">Address: Unit 1, J666+8J6 Lendes Inn, Almeda Hwy, Naga City, 4400 Camarines Sur</p>
              <p className="mt-2">Phone: <a href="tel:+639198633539" className="text-primary hover:underline">0919 863 3539</a></p>
              <p className="mt-2">Email: <a href="mailto:teamocsph@gmail.com" className="text-primary hover:underline">teamocsph@gmail.com</a></p>
              <p className="mt-2">Website: <a href="https://onlinecreativesolutions.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://onlinecreativesolutions.com</a></p>
            </div>
          </section>

          <section className="mb-8">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Additional Resources</h3>
              <div className="space-y-2">
                <p>
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> - Learn about how we collect and use your data
                </p>
                <p>
                  <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> - Review our terms and conditions
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer1 />
    </div>
  );
}
