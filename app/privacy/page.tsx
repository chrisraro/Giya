import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LpNavbar1 } from "@/components/pro-blocks/landing-page/lp-navbars/lp-navbar-1";
import { Footer1 } from "@/components/pro-blocks/landing-page/footers/footer-1";
import { Logo } from "@/components/pro-blocks/logo";

export const metadata: Metadata = {
  title: "Privacy Policy | Naga Perks by Giya",
  description: "Privacy policy for Naga Perks - Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
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
          
          <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: October 30, 2025</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to Naga Perks by Giya ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web platform (collectively, the "Service").
            </p>
            <p>
              By accessing or using Naga Perks, you agree to the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide Directly</h3>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, phone number, profile picture, and password when you create an account.</li>
              <li><strong>Business Information:</strong> For business accounts, we collect business name, address, contact details, business license information, and bank account details for payment processing.</li>
              <li><strong>Transaction Data:</strong> Information about points earned, rewards redeemed, deals purchased, and QR code scans.</li>
              <li><strong>User Content:</strong> Reviews, ratings, comments, photos, and other content you submit through the Service.</li>
              <li><strong>Communications:</strong> Messages you send to us or through the platform, including customer support inquiries.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Information Collected Automatically</h3>
            <ul>
              <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, mobile network information.</li>
              <li><strong>Location Data:</strong> With your permission, we collect precise location data to show nearby businesses and enable location-based features.</li>
              <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the app, search queries, and interaction patterns.</li>
              <li><strong>Log Data:</strong> IP address, browser type, access times, and referring URLs.</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies, web beacons, and similar tracking technologies to enhance your experience.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Information from Third Parties</h3>
            <ul>
              <li><strong>Social Media:</strong> If you authenticate using Google or Facebook, we receive your name, email, and profile picture.</li>
              <li><strong>Payment Processors:</strong> Transaction confirmation and payment status from our payment partners.</li>
              <li><strong>Analytics Providers:</strong> Aggregated usage statistics and performance metrics.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve the Naga Perks platform and features.</li>
              <li><strong>Account Management:</strong> To create and manage your account, authenticate users, and enable profile customization.</li>
              <li><strong>Transaction Processing:</strong> To process points, rewards, deals, and affiliate commissions.</li>
              <li><strong>Personalization:</strong> To customize content, recommendations, and offers based on your preferences and location.</li>
              <li><strong>Communications:</strong> To send transactional emails, notifications, updates, and promotional materials (with your consent).</li>
              <li><strong>Customer Support:</strong> To respond to inquiries, resolve issues, and provide technical assistance.</li>
              <li><strong>Analytics:</strong> To analyze usage patterns, improve our Service, and develop new features.</li>
              <li><strong>Security:</strong> To detect, prevent, and address fraud, security issues, and technical problems.</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations, enforce our terms, and protect our rights.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul>
              <li>Encryption of data in transit using SSL/TLS protocols</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection and privacy</li>
              <li>Secure payment processing through PCI-DSS compliant providers</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Specific retention periods include:
            </p>
            <ul>
              <li><strong>Account Data:</strong> Retained while your account is active and for 1 year after account closure.</li>
              <li><strong>Transaction Records:</strong> Retained for 7 years for accounting and legal compliance purposes.</li>
              <li><strong>Communications:</strong> Customer support messages retained for 2 years.</li>
              <li><strong>Marketing Data:</strong> Deleted within 30 days of unsubscribing from marketing communications.</li>
            </ul>
            <p>
              After the retention period, we securely delete or anonymize your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Sharing Your Information</h2>
            <p>We may share your information with the following parties:</p>
            <ul>
              <li><strong>Business Partners:</strong> Businesses you interact with receive necessary information to fulfill rewards, deals, and transactions.</li>
              <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (hosting, analytics, payment processing, customer support).</li>
              <li><strong>Influencers:</strong> For affiliate marketing programs, we share transaction data with influencers who referred you.</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information.</li>
            </ul>
            <p>
              We do not sell your personal information to third parties for their marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations).</li>
              <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing of your information for certain purposes.</li>
              <li><strong>Restriction:</strong> Request restriction of processing your information.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw previously given consent at any time.</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications.</li>
            </ul>
            <p>
              To exercise these rights, please contact us at <a href="tel:+639198633539" className="text-primary hover:underline">0919 863 3539</a> or <a href="mailto:teamocsph@gmail.com" className="text-primary hover:underline">teamocsph@gmail.com</a>. We will respond within 30 days of receiving your request.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to improve your experience, analyze usage, and deliver personalized content. Types of cookies we use:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the Service to function properly.</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service.</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements.</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Note that disabling certain cookies may affect functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p>
              Naga Perks is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately at <a href="tel:+639198633539" className="text-primary hover:underline">0919 863 3539</a> or <a href="mailto:teamocsph@gmail.com" className="text-primary hover:underline">teamocsph@gmail.com</a>, and we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than the Philippines. These countries may have different data protection laws. By using our Service, you consent to such transfers. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites, applications, or services. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of any third-party services you visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by:
            </p>
            <ul>
              <li>Posting the updated policy on this page with a new "Last Updated" date</li>
              <li>Sending an email notification to your registered email address</li>
              <li>Displaying a prominent notice within the Service</li>
            </ul>
            <p>
              Your continued use of the Service after changes become effective constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p className="font-semibold">Online Creative Solutions</p>
              <p>Address: Unit 1, J666+8J6 Lendes Inn, Almeda Hwy, Naga City, 4400 Camarines Sur</p>
              <p>Phone: <a href="tel:+639198633539" className="text-primary hover:underline">0919 863 3539</a></p>
              <p>Email: <a href="mailto:teamocsph@gmail.com" className="text-primary hover:underline">teamocsph@gmail.com</a></p>
              <p>Website: <a href="https://onlinecreativesolutions.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://onlinecreativesolutions.com</a></p>
            </div>
          </section>
        </div>
      </main>

      <Footer1 />
    </div>
  );
}
