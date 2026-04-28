import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

// LATAM country codes for Spanish default
const LATAM_COUNTRIES = new Set([
  "MX", "AR", "CO", "CL", "PE", "EC", "VE", "GT", "CU", "BO",
  "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "ES",
]);

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false, // We handle detection manually
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, auth callback, and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next/") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return await updateSession(request);
  }

  // Check if the pathname already has a locale prefix
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale prefix, detect and redirect
  if (!pathnameHasLocale) {
    // Check cookie first (user preference)
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    if (cookieLocale && routing.locales.includes(cookieLocale as "en" | "es")) {
      const url = request.nextUrl.clone();
      url.pathname = `/${cookieLocale}${pathname}`;
      return NextResponse.redirect(url);
    }

    // Geo-detect: LATAM → es, otherwise → en
    const country = request.geo?.country || "";
    const detectedLocale = LATAM_COUNTRIES.has(country) ? "es" : "en";

    const url = request.nextUrl.clone();
    url.pathname = `/${detectedLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Run next-intl middleware (sets locale context)
  const intlResponse = intlMiddleware(request);

  // Extract locale from path for Supabase middleware
  const locale = pathname.split("/")[1];

  // Run Supabase session update
  const supabaseResponse = await updateSession(request);

  // If Supabase wants to redirect, adjust the redirect URL to include locale
  if (supabaseResponse.headers.get("location")) {
    const location = supabaseResponse.headers.get("location")!;
    const redirectUrl = new URL(location, request.url);

    // If the redirect path doesn't have a locale, add it
    const redirectHasLocale = routing.locales.some(
      (l) =>
        redirectUrl.pathname.startsWith(`/${l}/`) ||
        redirectUrl.pathname === `/${l}`
    );
    if (!redirectHasLocale) {
      redirectUrl.pathname = `/${locale}${redirectUrl.pathname}`;
    }

    return NextResponse.redirect(redirectUrl, {
      headers: supabaseResponse.headers,
    });
  }

  // Merge cookies from Supabase response into intl response
  if (intlResponse) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return intlResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
