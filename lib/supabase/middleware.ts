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
  ];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Subscription gating: block expired/cancelled accounts (except on /settings and /onboarding)
  if (user && isProtected && pathname !== "/settings" && pathname !== "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    const blockedStatuses = ["past_due", "cancelled"];
    if (profile && blockedStatuses.includes(profile.subscription_status)) {
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
