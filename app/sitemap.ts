import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { LOCALES } from "@/lib/site";

// Only real, indexable public pages. No login, app, or account pages.
const PATHS = [
  "",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
  "/legal/refund",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PATHS) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.3,
        alternates: {
          languages: {
            en: `${SITE_URL}/en${path}`,
            es: `${SITE_URL}/es${path}`,
          },
        },
      });
    }
  }

  return entries;
}
