/**
 * Central site configuration. Single source of truth for the brand name,
 * canonical URL, and other site-wide constants. All absolute URLs in the app
 * must be built from SITE_URL so there is only one place to change them.
 */

export const SITE_NAME = "Stoova";

// Canonical site URL, without a trailing slash. Set NEXT_PUBLIC_SITE_URL in the
// environment (e.g. Vercel). Falls back to the official production domain.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stoovaapp.com"
).replace(/\/+$/, "");

export const SITE_TAGLINE = "Protein and strength plans for people on GLP-1s";

export const SITE_DESCRIPTION =
  "Stoova helps people on GLP-1 medications focus on protein and strength during weight loss, with daily protein targets, meal ideas, training plans, and medication tracking.";

// Support address shown to users. Note: the mailbox must exist to receive mail.
export const SUPPORT_EMAIL = "support@stoovaapp.com";

// The product's previous name, used for "formerly known as" copy and schema.
export const FORMER_NAME = "MuscleGuard";

// Filled in later by the team; empty links are omitted where used.
export const SOCIAL_LINKS = {
  instagram: "",
  tiktok: "",
};

export const LOCALES = ["en", "es"] as const;
export const DEFAULT_LOCALE = "en";
