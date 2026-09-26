import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Private areas, matched across locales (/en/dashboard, /es/dashboard, ...).
const DISALLOW = [
  "/*/dashboard",
  "/*/meals",
  "/*/training",
  "/*/medication",
  "/*/progress",
  "/*/reports",
  "/*/settings",
  "/*/onboarding",
  "/*/checkout",
  "/*/login",
  "/api/",
  "/auth/",
  "/admin",
];

// Explicitly allow the search and AI answer crawlers with the same disallow set.
const NAMED_BOTS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...NAMED_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
