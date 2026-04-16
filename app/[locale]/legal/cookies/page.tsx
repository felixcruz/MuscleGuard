import Link from "next/link";

export default function CookiePolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        &larr; Back to home
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-8">Cookie Policy</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-600">
        <p className="text-xs text-gray-400">Last updated: April 2026</p>

        <p>
          This Cookie Policy explains how MuscleGuard (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) uses cookies and similar technologies when you use our wellness tracking
          application (the &ldquo;Service&rdquo;). This policy is part of our{" "}
          <Link href="/legal/privacy" className="text-brand-600 hover:underline">
            Privacy Policy
          </Link>.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your device (computer, tablet, or mobile
            phone) when you visit a website. They are widely used to make websites work more
            efficiently, provide a better user experience, and give website operators information
            about how the site is being used.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. Cookies We Use</h2>
          <p>
            MuscleGuard uses a minimal set of cookies, limited to what is necessary for the Service
            to function properly. We categorize our cookies as follows:
          </p>

          <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Strictly Necessary Cookies (Authentication)</h3>
          <p>
            These cookies are essential for the Service to function. They enable you to log in, stay
            authenticated, and access your account securely. Without these cookies, the Service
            cannot operate.
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Cookie</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Purpose</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-700">Provider</th>
                  <th className="text-left py-2 font-medium text-gray-700">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
                  <td className="py-2 pr-4">Authentication session token. Keeps you logged in to your account.</td>
                  <td className="py-2 pr-4">Supabase</td>
                  <td className="py-2">Session / 1 year</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token-code-verifier</td>
                  <td className="py-2 pr-4">PKCE code verifier for secure authentication flow.</td>
                  <td className="py-2 pr-4">Supabase</td>
                  <td className="py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-medium text-gray-800 mt-6 mb-2">Cookies We Do Not Use</h3>
          <p>MuscleGuard does not use:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Advertising or tracking cookies:</strong> We do not serve ads, and we do not
              use cookies to track your activity across other websites.
            </li>
            <li>
              <strong>Analytics cookies:</strong> We do not currently use third-party analytics
              cookies (such as Google Analytics).
            </li>
            <li>
              <strong>Social media cookies:</strong> We do not embed social media widgets that set
              cookies.
            </li>
            <li>
              <strong>Third-party marketing cookies:</strong> We do not share cookie data with
              advertising networks or marketing platforms.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. How to Manage Cookies</h2>
          <p>
            Because MuscleGuard only uses strictly necessary cookies for authentication, disabling
            these cookies will prevent you from logging in to and using the Service.
          </p>
          <p className="mt-3">
            You can manage cookies through your browser settings. Most browsers allow you to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>View what cookies are stored on your device.</li>
            <li>Delete individual cookies or all cookies.</li>
            <li>Block cookies from specific or all websites.</li>
            <li>Set preferences for first-party vs. third-party cookies.</li>
          </ul>
          <p className="mt-3">
            Instructions for managing cookies in common browsers:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Chrome:</strong> Settings &gt; Privacy and security &gt; Cookies and other site data
            </li>
            <li>
              <strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data
            </li>
            <li>
              <strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data
            </li>
            <li>
              <strong>Edge:</strong> Settings &gt; Cookies and site permissions &gt; Cookies and site data
            </li>
          </ul>
          <p className="mt-3">
            Please note that if you block or delete the authentication cookies used by MuscleGuard,
            you will be logged out and will need to sign in again.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Changes to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices
            or for operational, legal, or regulatory reasons. We will post any changes on this page
            and update the &ldquo;Last updated&rdquo; date. If we begin using additional types of
            cookies (such as analytics), we will update this policy and notify you accordingly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, please contact us at{" "}
            <a href="mailto:support@muscleguard.app" className="text-brand-600 hover:underline">
              support@muscleguard.app
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
