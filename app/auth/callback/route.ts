import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // Handle error from Supabase
  if (error) {
    console.error("Auth error:", error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, request.url)
    );
  }

  // If no code, redirect to login
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=No authorization code", request.url));
  }

  try {
    const supabase = await createClient();

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Exchange error:", exchangeError.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      );
    }

    // Get the user to verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User fetch error:", userError?.message);
      return NextResponse.redirect(new URL("/login?error=Failed to verify user", request.url));
    }

    // Redirect to original page or dashboard
    const redirect = searchParams.get("redirect");
    const targetUrl = new URL(request.nextUrl);
    targetUrl.pathname = redirect && redirect.startsWith("/") ? redirect : "/dashboard";
    targetUrl.searchParams.delete("code");
    targetUrl.searchParams.delete("redirect");
    return NextResponse.redirect(targetUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    console.error("Callback error:", message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
