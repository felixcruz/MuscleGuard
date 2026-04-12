import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyPassword,
  verifyTOTP,
  generateSessionToken,
  hashToken,
  SESSION_DURATION_MS,
} from "@/lib/admin-auth";
import { auditLog } from "@/lib/admin-audit";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  let body: { email?: string; password?: string; totp_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password, totp_code } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 12) {
    return NextResponse.json(
      { error: "Password must be at least 12 characters" },
      { status: 400 }
    );
  }

  // Look up user by email via Supabase auth admin
  const { data: usersData } = await supabase.auth.admin.listUsers({
    perPage: 1,
    page: 1,
  });

  // We need to find the user by email — listUsers doesn't filter,
  // so we search across all users. For admin use this is fine.
  // Actually, let's use a more efficient approach.
  // Supabase doesn't have a getUserByEmail, so we query auth.users via RPC
  // or just search profiles. Let's use the admin API properly.

  // Find user by email using admin API
  let userId: string | null = null;
  let page = 1;
  const perPage = 100;
  let found = false;

  while (!found) {
    const { data: pageData } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (!pageData?.users?.length) break;
    const match = pageData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (match) {
      userId = match.id;
      found = true;
    }
    if (pageData.users.length < perPage) break;
    page++;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Get admin credentials
  const { data: creds } = await supabase
    .from("admin_credentials")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!creds) {
    return NextResponse.json(
      { error: "Admin credentials not configured" },
      { status: 401 }
    );
  }

  // Check if locked
  if (
    creds.failed_attempts >= 5 &&
    creds.locked_until &&
    new Date(creds.locked_until) > new Date()
  ) {
    const lockedMinutes = Math.ceil(
      (new Date(creds.locked_until).getTime() - Date.now()) / 60000
    );
    return NextResponse.json(
      { error: "Account locked", lockedMinutes },
      { status: 423 }
    );
  }

  // Verify password
  const passwordValid = await verifyPassword(password, creds.password_hash);
  if (!passwordValid) {
    const newAttempts = (creds.failed_attempts ?? 0) + 1;
    const updateData: Record<string, unknown> = {
      failed_attempts: newAttempts,
    };
    if (newAttempts >= 5) {
      updateData.locked_until = new Date(
        Date.now() + 15 * 60 * 1000
      ).toISOString();
    }
    await supabase
      .from("admin_credentials")
      .update(updateData)
      .eq("user_id", userId);

    await auditLog({
      adminUserId: userId,
      action: "login_failed",
      details: { reason: "invalid_password", attempts: newAttempts },
      ipAddress:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        undefined,
    });

    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Check TOTP
  if (creds.totp_enabled) {
    if (!totp_code) {
      return NextResponse.json({ requiresTOTP: true });
    }
    if (!verifyTOTP(creds.totp_secret, totp_code)) {
      await auditLog({
        adminUserId: userId,
        action: "login_failed",
        details: { reason: "invalid_totp" },
        ipAddress:
          request.headers.get("x-forwarded-for") ??
          request.headers.get("x-real-ip") ??
          undefined,
      });
      return NextResponse.json(
        { error: "Invalid two-factor code" },
        { status: 401 }
      );
    }
  }

  // Success — create session
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  await supabase.from("admin_sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    ip_address: ip,
    user_agent: userAgent,
  });

  // Reset failed attempts
  await supabase
    .from("admin_credentials")
    .update({ failed_attempts: 0, locked_until: null })
    .eq("user_id", userId);

  // Audit log
  await auditLog({
    adminUserId: userId,
    action: "login_success",
    ipAddress: ip ?? undefined,
  });

  // Set httpOnly cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return response;
}
