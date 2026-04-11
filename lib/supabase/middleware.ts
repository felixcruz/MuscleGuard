import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // Skip middleware checks for auth callback
  if (pathname === "/auth/callback") {
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
  ];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Profile checks: onboarding gate + subscription gate
  if (user && isProtected && pathname !== "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, onboarding_done")
      .eq("id", user.id)
      .single();

    // Force onboarding if not completed
    if (profile && !profile.onboarding_done) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      return NextResponse.redirect(onboardingUrl);
    }

    // Block expired/cancelled accounts (except settings)
    const blockedStatuses = ["past_due", "cancelled"];
    if (profile && blockedStatuses.includes(profile.subscription_status) && pathname !== "/settings") {
      const settingsUrl = request.nextUrl.clone();
      settingsUrl.pathname = "/settings";
      return NextResponse.redirect(settingsUrl);
    }
  }

  // Redirect authenticated users away from login
  if (pathname === "/login" && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
