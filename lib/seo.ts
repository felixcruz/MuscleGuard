import type { Metadata } from "next";
import { SITE_URL } from "./site";

/**
 * Canonical + hreflang + per-locale Open Graph for a public, indexable page.
 *
 * @param locale current locale ("en" | "es")
 * @param path   path after the locale, e.g. "" for the landing or
 *               "/legal/terms". No trailing slash.
 */
export function pageMetadata(
  locale: string,
  path: string,
  opts?: { title?: string; description?: string }
): Metadata {
  const suffix = path === "/" ? "" : path;
  const canonical = `${SITE_URL}/${locale}${suffix}`;
  // Note: openGraph is intentionally not set here. Defining it per page would
  // suppress the file-based opengraph-image. The root layout supplies the OG
  // block and the image; here we only add canonical + hreflang (and title).
  return {
    ...(opts?.title ? { title: opts.title } : {}),
    ...(opts?.description ? { description: opts.description } : {}),
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en${suffix}`,
        es: `${SITE_URL}/es${suffix}`,
        "x-default": `${SITE_URL}/en${suffix}`,
      },
    },
  };
}

/** Keep a page out of the index but let bots follow its links. */
export const noindexMetadata: Metadata = {
  robots: { index: false, follow: true },
};
