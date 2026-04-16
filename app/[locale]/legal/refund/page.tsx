import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        &larr; Back to home
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-8">Refund Policy</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-600">
        <p className="text-xs text-gray-400">Last updated: April 2026</p>

        <p>
          We want you to be satisfied with MuscleGuard. This Refund Policy explains how refunds
          work for our subscription service.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">1. 7-Day Free Trial</h2>
          <p>
            All new MuscleGuard accounts include a 7-day free trial. During the trial period, you
            have full access to all features of the Service. A valid payment method is required to
            start the trial.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>No charge during the trial:</strong> You will not be charged during the 7-day
              trial period.
            </li>
            <li>
              <strong>Cancel before the trial ends:</strong> If you cancel your subscription before
              the trial period expires, you will not be billed. You can cancel at any time through
              Settings &gt; Billing via the Stripe customer portal.
            </li>
            <li>
              <strong>After the trial:</strong> If you do not cancel before the trial ends, your
              subscription will automatically begin and your payment method will be charged $14.99
              for the first month.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">2. Refund Requests Within 14 Days of Billing</h2>
          <p>
            If you are charged for a subscription renewal and wish to request a refund, you may do
            so within 14 days of the billing date. To be eligible for a refund:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>The refund request must be submitted within 14 calendar days of the charge.</li>
            <li>
              You must cancel your subscription through Settings &gt; Billing via the Stripe
              customer portal.
            </li>
            <li>
              Contact us at{" "}
              <a href="mailto:support@muscleguard.app" className="text-brand-600 hover:underline">
                support@muscleguard.app
              </a>{" "}
              with your account email address and the reason for your refund request.
            </li>
          </ul>
          <p className="mt-3">
            We will process eligible refund requests within 5-10 business days. Refunds are issued
            to the original payment method used for the transaction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">3. After 14 Days</h2>
          <p>
            Refund requests made more than 14 days after a billing date are generally not eligible
            for a refund. We do not provide partial-month refunds for unused portions of a billing
            period.
          </p>
          <p className="mt-3">
            When you cancel your subscription, you will continue to have access to the Service until
            the end of your current billing period. Your subscription will not renew, and you will
            not be charged again.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">4. How to Cancel Your Subscription</h2>
          <p>
            You can cancel your MuscleGuard subscription at any time by following these steps:
          </p>
          <ol className="list-decimal pl-6 mt-2 space-y-1">
            <li>Log in to your MuscleGuard account.</li>
            <li>Go to <strong>Settings</strong>.</li>
            <li>Click on <strong>Billing</strong>.</li>
            <li>Click <strong>Manage subscription</strong> to open the Stripe customer portal.</li>
            <li>Select <strong>Cancel subscription</strong> in the Stripe portal.</li>
          </ol>
          <p className="mt-3">
            Your cancellation will take effect at the end of your current billing period. You will
            retain access to all features until then.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">5. Disputes and Chargebacks</h2>
          <p>
            If you have a billing dispute or believe you were charged in error, please contact us at{" "}
            <a href="mailto:support@muscleguard.app" className="text-brand-600 hover:underline">
              support@muscleguard.app
            </a>{" "}
            before initiating a chargeback with your bank or credit card company. We are committed
            to resolving billing issues promptly and fairly.
          </p>
          <p className="mt-3">
            Filing a chargeback without first contacting us may result in a delay in resolving your
            issue and could lead to the suspension of your account while the dispute is investigated.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">6. Exceptions</h2>
          <p>
            In exceptional circumstances (such as extended service outages, billing errors on our
            end, or other extenuating situations), we may issue refunds outside of the standard
            14-day window at our discretion. Please contact us at{" "}
            <a href="mailto:support@muscleguard.app" className="text-brand-600 hover:underline">
              support@muscleguard.app
            </a>{" "}
            to discuss your situation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">7. Contact Information</h2>
          <p>
            For all billing and refund inquiries, please contact us at:
          </p>
          <ul className="list-none pl-0 mt-2 space-y-1">
            <li>
              Email:{" "}
              <a href="mailto:support@muscleguard.app" className="text-brand-600 hover:underline">
                support@muscleguard.app
              </a>
            </li>
          </ul>
          <p className="mt-3">
            We aim to respond to all billing inquiries within 2 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
