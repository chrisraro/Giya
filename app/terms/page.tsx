import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";
import { Footer1 } from "@/components/pro-blocks/landing-page/footers/footer-1";
import { Logo } from "@/components/pro-blocks/logo";

export const metadata: Metadata = {
  title: "Terms of Service | Naga Perks by Giya",
  description: "Terms of Service for Naga Perks - Review the terms and conditions for using our platform.",
};

export default function TermsPage() {
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
          
          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last Updated: October 30, 2025</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p>
              Welcome to Naga Perks by Giya. These Terms of Service ("Terms") govern your access to and use of the Naga Perks mobile application, website, and related services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p>
              If you do not agree to these Terms, you may not access or use the Service. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p>
              Naga Perks is a hyperlocal discovery and privilege platform that connects three types of users:
            </p>
            <ul>
              <li><strong>Customers:</strong> Earn points by shopping at participating businesses and redeem rewards.</li>
              <li><strong>Businesses:</strong> Create loyalty programs, offer deals, and engage with local customers.</li>
              <li><strong>Influencers:</strong> Promote businesses through affiliate marketing and earn commissions.</li>
            </ul>
            <p>
              The Service facilitates QR code-based point redemptions, discount offers, exclusive deals, rewards programs, and social sharing features to enhance local community engagement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Eligibility</h2>
            <p>
              To use Naga Perks, you must:
            </p>
            <ul>
              <li>Be at least 13 years of age (or 18 years for business accounts)</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
            <p>
              By creating an account, you represent and warrant that you meet these eligibility requirements. We reserve the right to refuse service or terminate accounts that violate these requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Roles and Responsibilities</h2>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Customer Responsibilities</h3>
            <p>As a customer, you agree to:</p>
            <ul>
              <li>Provide accurate information when creating your account</li>
              <li>Use the Service for personal, non-commercial purposes only</li>
              <li>Scan QR codes only for legitimate transactions at participating businesses</li>
              <li>Redeem rewards and deals in accordance with their specific terms and conditions</li>
              <li>Not abuse, exploit, or manipulate the points system</li>
              <li>Provide honest and constructive reviews and ratings</li>
              <li>Report any suspicious activity or technical issues</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Business Responsibilities</h3>
            <p>As a business user, you agree to:</p>
            <ul>
              <li>Provide accurate business information, including name, address, contact details, and operating hours</li>
              <li>Maintain a valid business license and comply with all local regulations</li>
              <li>Honor all published deals, rewards, and point-earning opportunities</li>
              <li>Generate and display QR codes for customer point redemption</li>
              <li>Verify customer eligibility before approving point claims or reward redemptions</li>
              <li>Respond promptly to customer inquiries and disputes</li>
              <li>Not create fraudulent deals, misleading offers, or deceptive marketing</li>
              <li>Maintain adequate inventory to fulfill rewards and deals</li>
              <li>Pay applicable fees and commissions in a timely manner</li>
              <li>Protect customer privacy and data in accordance with our Privacy Policy</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Influencer Responsibilities</h3>
            <p>As an influencer, you agree to:</p>
            <ul>
              <li>Promote businesses honestly and transparently</li>
              <li>Disclose your affiliate relationship in compliance with advertising regulations</li>
              <li>Not engage in deceptive, misleading, or fraudulent marketing practices</li>
              <li>Generate referrals through legitimate means only</li>
              <li>Comply with platform content guidelines and community standards</li>
              <li>Not spam, harass, or engage in unethical promotional tactics</li>
              <li>Accurately represent the businesses and offers you promote</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
            </p>
            <ul>
              <li>Create a strong, unique password</li>
              <li>Not share your account credentials with others</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>Log out from your account when using shared or public devices</li>
            </ul>
            <p>
              We are not responsible for unauthorized access to your account if you fail to maintain password confidentiality. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Points and Rewards System</h2>
            
            <h3 className="text-xl font-semibold mb-3">6.1 Earning Points</h3>
            <p>
              Customers earn points by making qualifying purchases at participating businesses. Points are awarded based on criteria set by each business, which may include:
            </p>
            <ul>
              <li>Purchase amount (e.g., 1 point per ₱10 spent)</li>
              <li>Visit frequency (e.g., bonus points for repeat visits)</li>
              <li>Specific products or services purchased</li>
              <li>Promotional events or special campaigns</li>
            </ul>
            <p>
              Points are credited to your account after the business verifies and approves the transaction via QR code scan. Points may take up to 24 hours to appear in your account.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Redeeming Rewards</h3>
            <p>
              Accumulated points can be redeemed for rewards offered by participating businesses. Each reward has specific redemption requirements, including:
            </p>
            <ul>
              <li>Minimum point balance required</li>
              <li>Expiration dates or blackout periods</li>
              <li>Quantity limitations or availability restrictions</li>
              <li>Terms and conditions set by the business</li>
            </ul>
            <p>
              Once redeemed, rewards cannot be refunded, exchanged, or transferred. Rewards must be used within the specified validity period.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.3 Point Expiration and Forfeiture</h3>
            <p>
              Points may expire or be forfeited under the following circumstances:
            </p>
            <ul>
              <li>Account inactivity for more than 12 consecutive months</li>
              <li>Account closure or termination</li>
              <li>Violation of these Terms or fraudulent activity</li>
              <li>Business discontinuation of loyalty program</li>
              <li>Expiration dates set by individual businesses</li>
            </ul>
            <p>
              Naga Perks reserves the right to modify, suspend, or terminate the points system at any time with reasonable notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Deals and Promotions</h2>
            <p>
              Businesses may offer discounts, exclusive deals, and promotional offers through the Service. All deals are subject to:
            </p>
            <ul>
              <li>Specific terms and conditions set by the offering business</li>
              <li>Availability and inventory limitations</li>
              <li>Expiration dates and redemption deadlines</li>
              <li>Geographic restrictions and location requirements</li>
              <li>Exclusions or special conditions (e.g., "not valid with other offers")</li>
            </ul>
            <p>
              Naga Perks is not responsible for the quality, availability, or fulfillment of deals offered by businesses. Any disputes regarding deals should be resolved directly with the business. We reserve the right to remove deals that violate our policies or applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Business Obligations</h2>
            <p>
              Businesses using Naga Perks must comply with the following obligations:
            </p>
            <ul>
              <li><strong>Accuracy:</strong> Ensure all information, deals, and rewards are accurate and up-to-date</li>
              <li><strong>Fulfillment:</strong> Honor all published offers and commitments to customers</li>
              <li><strong>Legal Compliance:</strong> Maintain valid licenses, permits, and comply with all applicable laws</li>
              <li><strong>Customer Service:</strong> Respond to customer inquiries and resolve disputes professionally</li>
              <li><strong>Quality Standards:</strong> Maintain reasonable quality standards for products and services</li>
              <li><strong>Non-Discrimination:</strong> Treat all customers fairly without discrimination</li>
              <li><strong>Payment:</strong> Pay applicable fees, commissions, and transaction costs as agreed</li>
            </ul>
            <p>
              Failure to meet these obligations may result in account suspension, termination, or legal action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Prohibited Conduct</h2>
            <p>
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul>
              <li>Violating any laws, regulations, or third-party rights</li>
              <li>Impersonating any person or entity, or falsely stating your affiliation</li>
              <li>Engaging in fraudulent activities, including fake reviews, fake transactions, or point manipulation</li>
              <li>Using the Service for any unauthorized commercial purposes</li>
              <li>Interfering with or disrupting the Service or servers</li>
              <li>Attempting to gain unauthorized access to any part of the Service</li>
              <li>Transmitting viruses, malware, or other harmful code</li>
              <li>Harvesting or collecting user information without consent</li>
              <li>Spamming, harassing, or abusing other users</li>
              <li>Posting offensive, defamatory, or inappropriate content</li>
              <li>Reverse engineering, decompiling, or disassembling the Service</li>
              <li>Using automated bots, scripts, or scrapers without permission</li>
            </ul>
            <p>
              Violation of these prohibitions may result in immediate account termination and legal action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Intellectual Property Rights</h2>
            <p>
              All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, software, and design, are owned by Naga Perks by Giya or its licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal or business purposes as intended. You may not:
            </p>
            <ul>
              <li>Copy, modify, distribute, or create derivative works from our content</li>
              <li>Use our trademarks, logos, or branding without written permission</li>
              <li>Remove or alter any proprietary notices or labels</li>
              <li>Frame or mirror any part of the Service without authorization</li>
            </ul>
            <p>
              User-generated content (reviews, photos, comments) remains your property, but you grant us a worldwide, royalty-free, perpetual license to use, display, reproduce, and distribute such content in connection with the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NAGA PERKS BY GIYA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Service interruptions or system failures</li>
              <li>Errors, omissions, or inaccuracies in content</li>
              <li>Unauthorized access to or alteration of your data</li>
              <li>Actions or conduct of third parties, including businesses and users</li>
              <li>Quality, safety, or legality of products or services offered by businesses</li>
            </ul>
            <p>
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE OF THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ₱1,000, WHICHEVER IS GREATER.
            </p>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Naga Perks by Giya, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul>
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms or any applicable laws</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you submit or transmit through the Service</li>
              <li>Your interactions with other users or businesses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution and Governing Law</h2>
            
            <h3 className="text-xl font-semibold mb-3">13.1 Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">13.2 Dispute Resolution</h3>
            <p>
              In the event of any dispute, controversy, or claim arising out of or relating to these Terms or the Service, you agree to first contact us at <a href="mailto:support@nagaperks.app" className="text-primary hover:underline">support@nagaperks.app</a> to attempt to resolve the matter informally.
            </p>
            <p>
              If the dispute cannot be resolved informally within 30 days, either party may initiate formal dispute resolution proceedings. You agree to submit to the exclusive jurisdiction of the courts located in Naga City, Camarines Sur, Philippines.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">13.3 Class Action Waiver</h3>
            <p>
              You agree to resolve disputes with us on an individual basis and waive your right to participate in any class action, collective action, or representative proceeding.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and access to the Service at any time, with or without notice, for any reason, including:
            </p>
            <ul>
              <li>Violation of these Terms or our policies</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Prolonged account inactivity</li>
              <li>Non-payment of fees or charges</li>
              <li>At our sole discretion to protect the Service or other users</li>
            </ul>
            <p>
              You may terminate your account at any time by contacting us at <a href="mailto:support@nagaperks.app" className="text-primary hover:underline">support@nagaperks.app</a>. Upon termination:
            </p>
            <ul>
              <li>Your access to the Service will be revoked</li>
              <li>Unused points and unredeemed rewards may be forfeited</li>
              <li>You remain liable for any outstanding obligations</li>
              <li>Provisions intended to survive termination will remain in effect</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. When we make material changes, we will notify you by:
            </p>
            <ul>
              <li>Updating the "Last Updated" date at the top of this page</li>
              <li>Sending an email notification to your registered email address</li>
              <li>Displaying a prominent notice within the Service</li>
            </ul>
            <p>
              Your continued use of the Service after changes become effective constitutes your acceptance of the revised Terms. If you do not agree to the changes, you must stop using the Service and close your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy and any additional terms applicable to specific features or services, constitute the entire agreement between you and Naga Perks by Giya regarding your use of the Service, superseding any prior agreements or understandings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">18. Contact Information</h2>
            <p>
              If you have questions, concerns, or feedback regarding these Terms of Service, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p className="font-semibold">Naga Perks by Giya</p>
              <p>Email: <a href="mailto:support@nagaperks.app" className="text-primary hover:underline">support@nagaperks.app</a></p>
              <p>Legal: <a href="mailto:legal@nagaperks.app" className="text-primary hover:underline">legal@nagaperks.app</a></p>
              <p>Business Inquiries: <a href="mailto:business@nagaperks.app" className="text-primary hover:underline">business@nagaperks.app</a></p>
              <p>Address: Naga City, Camarines Sur, Philippines</p>
            </div>
          </section>

          <section className="mb-8">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Acknowledgment
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                By using Naga Perks by Giya, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our Service.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer1 />
    </div>
  );
}
