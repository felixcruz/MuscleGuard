import { GoogleAnalytics } from "@next/third-parties/google";

/**
 * Google Analytics for the PUBLIC marketing pages only (landing and legal).
 * It must never be rendered inside the app (dashboard, meals, medication,
 * etc.), where health data lives. Renders nothing if NEXT_PUBLIC_GA_ID is unset.
 */
export function MarketingAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
