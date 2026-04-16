import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        &larr; Back to home
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-8">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-600">
        <p className="text-xs text-gray-400">Last updated: April 2026</p>

        <p>
          MuscleGuard (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to
          protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and
          safeguard your information when you use our wellness tracking application (the
          &ldquo;Service&rdquo;). Please read this Privacy Policy carefully. By using the Service,
          you consent to the data practices described in this policy.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>

          <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Account Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email address (used for authentication and communication)</li>
            <li>Name (optional, for personalization)</li>
            <li>Password (stored securely via Supabase authentication, hashed and salted)</li>
          </ul>

          <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Health and Wellness Data</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Body weight and body composition measurements</li>
            <li>Height, age, and biological sex (for protein calculations)</li>
            <li>GLP-1 medication type, current dose, and dose history</li>
            <li>Injection dates and medication schedule</li>
            <li>Food logs and protein intake records</li>
            <li>Activity type, training frequency, and exercise logs</li>
            <li>Communication style preference</li>
          </ul>

          <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Usage Data</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Pages visited and features used within the Service</li>
            <li>Device type and browser information</li>
            <li>IP address (for security and fraud prevention)</li>
            <li>Timestamps of interactions with the Service</li>
          </ul>

          <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Payment Information</h3>
          <p>
            Payment details (credit card numbers, billing addresses) are collected and processed
            directly by Stripe, our payment processor. We do not store your full credit card number
            on our servers. We receive only a tokenized reference, card brand, last four digits,
            and expiration date from Stripe for display purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Provide the Service:</strong> Calculate your dose-adjusted protein targets,
              generate personalized meal suggestions, create training protocols, and deliver weekly
              reports.
            </li>
            <li>
              <strong>AI Meal Generation:</strong> Your dietary preferences, protein target, and
              appetite information are sent to our AI provider to generate personalized meal
              suggestions. This data is processed in real-time and is not stored by the AI provider
              for training purposes.
            </li>
            <li>
              <strong>Medication Reminders:</strong> Your medication schedule and email address are
              used to send automated injection reminders via email.
            </li>
            <li>
              <strong>Progress Tracking:</strong> Your weight, body composition, and protein intake
              data are used to generate progress charts and weekly performance reports.
            </li>
            <li>
              <strong>Account Management:</strong> Process payments, manage your subscription, and
              communicate with you about your account.
            </li>
            <li>
              <strong>Service Improvement:</strong> Analyze aggregate, de-identified usage patterns
              to improve the Service, fix bugs, and develop new features.
            </li>
            <li>
              <strong>Security:</strong> Detect and prevent fraud, abuse, and unauthorized access to
              the Service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. Third-Party Services</h2>
          <p>
            We use the following third-party services to operate MuscleGuard. Each service has
            access only to the data necessary to perform its function:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3">
            <li>
              <strong>Supabase</strong> (database and authentication): Stores your account
              information, health data, food logs, and application data. Supabase provides
              authentication services including secure password hashing and session management.
              Data is stored in the United States.
            </li>
            <li>
              <strong>Stripe</strong> (payment processing): Processes your subscription payments
              and manages your billing. Stripe receives your payment information directly and is
              PCI DSS Level 1 compliant. See{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                Stripe&apos;s Privacy Policy
              </a>.
            </li>
            <li>
              <strong>Resend</strong> (email delivery): Sends transactional emails including
              medication reminders and account notifications. Resend receives your email address and
              the content of the emails we send you.
            </li>
            <li>
              <strong>Anthropic Claude API</strong> (AI meal generation): Powers the AI meal wizard.
              Your dietary preferences, protein target, and meal parameters are sent to generate meal
              suggestions. Anthropic does not use API inputs for model training. See{" "}
              <a
                href="https://www.anthropic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                Anthropic&apos;s Privacy Policy
              </a>.
            </li>
            <li>
              <strong>Vercel</strong> (hosting and deployment): Hosts the MuscleGuard application.
              Vercel may process IP addresses and request metadata for performance and security
              purposes. See{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:underline"
              >
                Vercel&apos;s Privacy Policy
              </a>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Data Sharing and Disclosure</h2>
          <p>We do not sell, rent, or trade your personal information to third parties. We may disclose your information only in the following circumstances:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Service Providers:</strong> With the third-party services listed above, solely
              for the purpose of operating the Service.
            </li>
            <li>
              <strong>Legal Requirements:</strong> If required by law, subpoena, court order, or
              government regulation.
            </li>
            <li>
              <strong>Safety:</strong> If we believe disclosure is necessary to protect the rights,
              property, or safety of MuscleGuard, our users, or the public.
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale
              of assets, your data may be transferred. You will be notified of any such transfer.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed
            to provide the Service. Specifically:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Account data:</strong> Retained until you delete your account or request
              deletion.
            </li>
            <li>
              <strong>Health and wellness data:</strong> Retained until you delete your account.
              You may delete individual food logs and weight entries at any time within the Service.
            </li>
            <li>
              <strong>Payment records:</strong> Retained for 7 years after your last transaction as
              required for tax and accounting purposes.
            </li>
            <li>
              <strong>Usage data:</strong> Aggregated and de-identified usage data may be retained
              indefinitely for analytics purposes.
            </li>
          </ul>
          <p className="mt-3">
            Upon account deletion, we will delete your personal data within 30 days, except where
            retention is required by law or for legitimate business purposes (such as resolving
            disputes or enforcing our Terms).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information, including:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Encryption in transit (TLS/HTTPS) for all data transmitted between your device and our servers.</li>
            <li>Encryption at rest for stored data via Supabase.</li>
            <li>Secure password hashing via Supabase authentication.</li>
            <li>Row-level security policies on our database to ensure users can only access their own data.</li>
            <li>Regular security reviews and updates.</li>
          </ul>
          <p className="mt-3">
            While we strive to protect your information, no method of electronic transmission or
            storage is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Your Rights (CCPA / California Residents)</h2>
          <p>
            If you are a California resident, you have the following rights under the California
            Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Right to Know:</strong> You may request that we disclose the categories and
              specific pieces of personal information we have collected about you, the sources of
              that information, the purposes for which we use it, and the categories of third
              parties with whom we share it.
            </li>
            <li>
              <strong>Right to Delete:</strong> You may request that we delete the personal
              information we have collected about you, subject to certain exceptions.
            </li>
            <li>
              <strong>Right to Opt-Out of Sale:</strong> We do not sell your personal information.
              This right is not applicable.
            </li>
            <li>
              <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for
              exercising any of your CCPA rights.
            </li>
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at{" "}
            <a href="mailto:support@muscleguard.app" className="text-brand-600 hover:underline">
              support@muscleguard.app
            </a>. We will respond to verifiable consumer requests within 45 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Children&apos;s Privacy</h2>
          <p>
            MuscleGuard is not intended for use by individuals under the age of 18. We do not
            knowingly collect personal information from children under 18. If you are a parent or
            guardian and believe your child has provided us with personal information, please contact
            us at{" "}
            <a href="mailto:support@muscleguard.app" className="text-brand-600 hover:underline">
              support@muscleguard.app
            </a>{" "}
            and we will promptly delete such information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material
            changes by posting the new Privacy Policy on this page and updating the &ldquo;Last
            updated&rdquo; date. For significant changes, we will also notify you via email. Your
            continued use of the Service after any changes constitutes acceptance of the updated
            Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">10. Contact Information</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or our data practices,
            please contact us at:
          </p>
          <ul className="list-none pl-0 mt-2 space-y-1">
            <li>
              Email:{" "}
              <a href="mailto:support@muscleguard.app" className="text-brand-600 hover:underline">
                support@muscleguard.app
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
