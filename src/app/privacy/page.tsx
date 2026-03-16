import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | ThePayBureau',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-[#401D6C] hover:underline"
          >
            &larr; Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: 5 March 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-[0.92rem] leading-relaxed text-gray-700">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">1. Who We Are</h2>
              <p>
                Intelligent Payroll Limited T/A The Pay Bureau (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is the data controller responsible for your personal data. We are a company registered in England and Wales, providing a payroll bureau management platform (&ldquo;the Service&rdquo;).
              </p>
              <p>
                For any data protection queries, contact us at{' '}
                <a href="mailto:support@thepaybureau.com" className="text-[#401D6C] font-semibold hover:underline">
                  support@thepaybureau.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">2. What Data We Collect</h2>
              <p>We collect and process the following categories of personal data:</p>
              <p><strong>Account Data:</strong> Your name, email address, and password (hashed) when you register for an account.</p>
              <p><strong>Profile Data:</strong> Your profile photo (optional), display name, and account preferences.</p>
              <p><strong>Client Data:</strong> Information you enter about your payroll clients, including company names, PAYE references, contact details, payroll configurations, and employee counts. This data is entered and controlled by you.</p>
              <p><strong>Usage Data:</strong> Information about how you interact with the Service, including pages visited, features used, and timestamps of activity.</p>
              <p><strong>Technical Data:</strong> IP address, browser type, device information, and cookies (see Section 7).</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">3. How We Use Your Data</h2>
              <p>We use your personal data for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Providing and maintaining the Service, including user authentication and data storage</li>
                <li>Sending you important service notifications (e.g., security alerts, changes to terms)</li>
                <li>Sending payroll deadline reminders and notifications you have opted into</li>
                <li>Improving the Service based on usage patterns and feedback</li>
                <li>Processing payments for paid tier subscriptions</li>
                <li>Responding to your support requests and enquiries</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">4. Legal Basis for Processing</h2>
              <p>Under the UK General Data Protection Regulation (UK GDPR), we process your data on the following legal bases:</p>
              <p><strong>Contract (Article 6(1)(b)):</strong> Processing necessary to perform our contract with you (providing the Service).</p>
              <p><strong>Legitimate Interests (Article 6(1)(f)):</strong> Processing necessary for our legitimate interests, such as improving the Service, preventing fraud, and ensuring security, where these interests are not overridden by your rights.</p>
              <p><strong>Consent (Article 6(1)(a)):</strong> Where you have given specific consent, such as opting into marketing communications. You may withdraw consent at any time.</p>
              <p><strong>Legal Obligation (Article 6(1)(c)):</strong> Where we need to process data to comply with a legal obligation.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">5. Third-Party Processors</h2>
              <p>We use the following third-party services to operate the Service. Each processes data on our behalf under appropriate data processing agreements:</p>
              <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm border-collapse mt-3 min-w-[420px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Provider</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-900">Purpose</th>
                    <th className="text-left py-2 font-semibold text-gray-900">Location</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Supabase</td>
                    <td className="py-2 pr-4">Database, authentication, file storage</td>
                    <td className="py-2">EU (Frankfurt)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Vercel</td>
                    <td className="py-2 pr-4">Application hosting and deployment</td>
                    <td className="py-2">Global CDN (EU primary)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4">Stripe</td>
                    <td className="py-2 pr-4">Payment processing (paid tier only)</td>
                    <td className="py-2">US/EU</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Resend</td>
                    <td className="py-2 pr-4">Transactional email delivery</td>
                    <td className="py-2">US</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">6. Data Storage and Security</h2>
              <p>
                Your data is stored securely using industry-standard encryption. All data is encrypted in transit (TLS 1.2+) and at rest. Database access is protected by Row Level Security policies that ensure you can only access data belonging to your own account or organisation.
              </p>
              <p>
                We implement appropriate technical and organisational measures to protect your data against unauthorised access, alteration, disclosure, or destruction. These include access controls, regular security reviews, and secure development practices.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">7. Cookies</h2>
              <p>We use the following types of cookies:</p>
              <p><strong>Essential Cookies:</strong> Required for authentication and security. These cannot be disabled as the Service will not function without them.</p>
              <p><strong>Preference Cookies:</strong> Store your settings such as theme preference (light/dark mode). These improve your experience but are not strictly necessary.</p>
              <p>
                We do not use advertising cookies or third-party tracking cookies. We do not sell your data to advertisers or data brokers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">8. Your Rights Under GDPR</h2>
              <p>Under the UK GDPR, you have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data (&ldquo;right to be forgotten&rdquo;)</li>
                <li><strong>Right to Data Portability:</strong> Request your data in a structured, machine-readable format</li>
                <li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your data</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw it at any time</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:support@thepaybureau.com" className="text-[#401D6C] font-semibold hover:underline">
                  support@thepaybureau.com
                </a>
                . We will respond within 30 days.
              </p>
              <p>
                You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at{' '}
                <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-[#401D6C] font-semibold hover:underline">
                  ico.org.uk
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">9. Data Retention</h2>
              <p>
                We retain your personal data for as long as your account is active or as needed to provide the Service. If you close your account, we will delete your data within 90 days, except where we are required to retain it for legal or regulatory purposes.
              </p>
              <p>
                Client data you enter into the Service is deleted when you delete it or when your account is closed. We do not retain backups of deleted data beyond our standard backup rotation period (30 days).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">10. International Transfers</h2>
              <p>
                Some of our third-party processors (see Section 5) are based outside the UK and EU. Where personal data is transferred internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the Information Commissioner&apos;s Office, and adequacy decisions where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mt-8 mb-3">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through the Service. The &ldquo;Last updated&rdquo; date at the top of this page indicates when the policy was last revised.
              </p>
            </section>

            <section className="mt-10 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                For any privacy-related questions or concerns, contact our data protection team at{' '}
                <a href="mailto:support@thepaybureau.com" className="text-[#401D6C] font-semibold hover:underline">
                  support@thepaybureau.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
