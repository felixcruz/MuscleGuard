import Link from "next/link";

export default function TermsOfUse() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        &larr; Back to home
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-8">Terms of Use</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-600">
        <p className="text-xs text-gray-400">Last updated: April 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using MuscleGuard (&ldquo;the Service&rdquo;), you agree to be bound by
            these Terms of Use (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not
            access or use the Service. We reserve the right to update these Terms at any time. Your
            continued use of the Service after any changes constitutes acceptance of the revised Terms.
            We will notify you of material changes via email or through the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. Service Description</h2>
          <p>
            MuscleGuard is an educational wellness tracking tool designed to support individuals
            taking GLP-1 receptor agonist medications (such as semaglutide and tirzepatide) in
            monitoring their protein intake, physical activity, medication schedule, and body
            composition during weight loss.
          </p>
          <p className="mt-3">
            <strong>MuscleGuard is not a medical service.</strong> The Service does not provide
            medical advice, diagnoses, or treatment recommendations. MuscleGuard is not a medical
            device and is not intended to diagnose, treat, cure, or prevent any disease. All
            information provided through the Service is for educational and informational purposes
            only. You should always consult your healthcare provider before making any decisions
            about your diet, exercise routine, or medication.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. Account Requirements</h2>
          <p>To use MuscleGuard, you must:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Be at least 18 years of age.</li>
            <li>Be a resident of the United States (the Service is currently available in the US only).</li>
            <li>Provide a valid email address and accurate account information.</li>
            <li>Maintain the security and confidentiality of your login credentials.</li>
          </ul>
          <p className="mt-3">
            You are responsible for all activity that occurs under your account. You agree to notify
            us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. Subscription Terms</h2>
          <p>
            MuscleGuard offers a subscription plan at $14.99 per month. New users receive a 7-day
            free trial upon creating an account. A valid payment method is required to start the
            free trial.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Free Trial:</strong> Your 7-day free trial begins when you create your account
              and provide a payment method. You will not be charged during the trial period. If you
              cancel before the trial ends, you will not be billed.
            </li>
            <li>
              <strong>Auto-Renewal:</strong> After the free trial, your subscription will automatically
              renew on a monthly basis at $14.99 per month until you cancel. You authorize us to charge
              your payment method on file for each renewal period.
            </li>
            <li>
              <strong>Cancellation:</strong> You may cancel your subscription at any time through the
              Settings page via the Stripe billing portal. Cancellation takes effect at the end of
              your current billing period. You will retain access to the Service until the end of
              the paid period.
            </li>
            <li>
              <strong>Price Changes:</strong> We reserve the right to change subscription pricing.
              You will be notified at least 30 days in advance of any price increase. Continued use
              of the Service after a price change constitutes acceptance of the new pricing.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. User Responsibilities</h2>
          <p>When using MuscleGuard, you agree to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide accurate health information (weight, medication, dose) for the Service to function correctly.</li>
            <li>Not use the Service as a replacement for professional medical advice, diagnosis, or treatment.</li>
            <li>Consult your healthcare provider before making changes to your diet, exercise, or medication.</li>
            <li>Not share your account credentials with others.</li>
            <li>Not attempt to reverse engineer, decompile, or disassemble any part of the Service.</li>
            <li>Not use the Service for any illegal or unauthorized purpose.</li>
            <li>Not attempt to interfere with, disrupt, or compromise the integrity of the Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Intellectual Property</h2>
          <p>
            All content, features, and functionality of the Service — including but not limited to
            text, graphics, logos, algorithms, software, and the overall design — are the exclusive
            property of MuscleGuard and are protected by United States and international copyright,
            trademark, and other intellectual property laws.
          </p>
          <p className="mt-3">
            You are granted a limited, non-exclusive, non-transferable, revocable license to access
            and use the Service for personal, non-commercial purposes in accordance with these Terms.
            You may not copy, modify, distribute, sell, or lease any part of the Service without our
            prior written consent.
          </p>
          <p className="mt-3">
            Content you create within the Service (food logs, notes, etc.) remains yours. By using
            the Service, you grant us a limited license to process your content solely for the
            purpose of providing and improving the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MUSCLEGUARD AND ITS OFFICERS,
            DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
            LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE
            OF THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR
            ANY OTHER LEGAL THEORY.
          </p>
          <p className="mt-3">
            IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING
            TO THE SERVICE EXCEED THE AMOUNT YOU HAVE PAID TO US IN THE TWELVE (12) MONTHS
            PRECEDING THE CLAIM.
          </p>
          <p className="mt-3">
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
            WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">8. Medical Disclaimer</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-semibold text-amber-900">Important Medical Notice</p>
            <p className="mt-2 text-amber-800">
              MuscleGuard is not a medical device and is not intended to diagnose, treat, cure, or
              prevent any disease. The protein targets, meal suggestions, training protocols, and
              other information provided by the Service are for educational and informational purposes
              only. They are not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <p className="mt-2 text-amber-800">
              Always seek the advice of your physician or other qualified healthcare provider with
              any questions you may have regarding a medical condition, your GLP-1 medication, dietary
              changes, or exercise program. Never disregard professional medical advice or delay in
              seeking it because of information provided by MuscleGuard.
            </p>
            <p className="mt-2 text-amber-800">
              If you experience adverse effects from your medication, diet, or exercise, contact your
              healthcare provider immediately.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">9. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without
            cause, and with or without notice. Reasons for termination may include, but are not
            limited to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Violation of these Terms.</li>
            <li>Engaging in fraudulent or illegal activity.</li>
            <li>Non-payment of subscription fees.</li>
            <li>Conduct that we determine, in our sole discretion, is harmful to other users or the Service.</li>
          </ul>
          <p className="mt-3">
            Upon termination, your right to use the Service will cease immediately. You may request
            a copy of your data within 30 days of termination by contacting us. After 30 days, your
            data may be permanently deleted.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">10. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State
            of Delaware, United States, without regard to its conflict of law provisions. Any dispute
            arising from or relating to these Terms or the Service shall be resolved exclusively in
            the state or federal courts located in the State of Delaware, and you consent to the
            personal jurisdiction of such courts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">11. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:support@muscleguard.app" className="text-brand-600 hover:underline">
              support@muscleguard.app
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
