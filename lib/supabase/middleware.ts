import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Strip locale prefix to get the base path for route matching
function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|es)(\/.*)?$/);
  return match ? (match[2] || "/") : pathname;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const basePath = stripLocale(pathname);

  // Skip middleware checks for auth callback
  if (basePath === "/auth/callback") {
    return supabaseResponse;
  }

  // Protected routes: redirect to login if not authenticated
  const protectedPaths = [
    "/dashboard",
    "/meals",
    "/training",
    "/progress",
    "/settings",
    "/onboarding",
    "/medication",
    "/reports",
    "/checkout",
  ];
  const isProtected = protectedPaths.some((p) => basePath.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", basePath);
    return NextResponse.redirect(loginUrl);
  }

  // Profile checks: onboarding gate + subscription gate
  if (user && isProtected && basePath !== "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, onboarding_done")
      .eq("id", user.id)
      .single();

    // Force onboarding if not completed
    if (profile && !profile.onboarding_done && basePath !== "/onboarding") {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      return NextResponse.redirect(onboardingUrl);
    }

    // Block access to onboarding if already completed
    if (profile && profile.onboarding_done && basePath === "/onboarding") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }

    // Force checkout if onboarding done but no subscription
    if (profile && profile.onboarding_done && profile.subscription_status === "trial" && basePath !== "/checkout" && basePath !== "/settings") {
      const checkoutUrl = request.nextUrl.clone();
      checkoutUrl.pathname = "/checkout";
      return NextResponse.redirect(checkoutUrl);
    }

    // Block expired/cancelled accounts (except settings and checkout)
    const blockedStatuses = ["past_due", "cancelled"];
    if (profile && blockedStatuses.includes(profile.subscription_status) && basePath !== "/settings" && basePath !== "/checkout") {
      const settingsUrl = request.nextUrl.clone();
      settingsUrl.pathname = "/settings";
      return NextResponse.redirect(settingsUrl);
    }
  }

  // Redirect authenticated users away from login
  if (basePath === "/login" && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
