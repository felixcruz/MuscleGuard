import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";
import { generateTOTPSecret, verifyTOTP } from "@/lib/admin-auth";
import { auditLog } from "@/lib/admin-audit";

// POST: Generate a new TOTP secret
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = generateTOTPSecret();
  const supabase = createAdminClient();

  // Store the secret (not yet enabled)
  await supabase
    .from("admin_credentials")
    .update({ totp_secret: secret, totp_enabled: false })
    .eq("user_id", session.userId);

  // Generate otpauth:// URL
  const otpauthUrl = `otpauth://totp/MuscleGuard:${encodeURIComponent(session.email)}?secret=${secret}&issuer=MuscleGuard&algorithm=SHA1&digits=6&period=30`;

  await auditLog({
    adminUserId: session.userId,
    action: "totp_secret_generated",
    ipAddress:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      undefined,
  });

  return NextResponse.json({ secret, otpauthUrl });
}

// PUT: Verify a TOTP code and enable 2FA
export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.code || body.code.length !== 6) {
    return NextResponse.json(
      { error: "A 6-digit code is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Get current secret
  const { data: creds } = await supabase
    .from("admin_credentials")
    .select("totp_secret")
    .eq("user_id", session.userId)
    .single();

  if (!creds?.totp_secret) {
    return NextResponse.json(
      { error: "No TOTP secret found. Generate one first." },
      { status: 400 }
    );
  }

  if (!verifyTOTP(creds.totp_secret, body.code)) {
    return NextResponse.json(
      { error: "Invalid code. Please try again." },
      { status: 400 }
    );
  }

  // Enable TOTP
  await supabase
    .from("admin_credentials")
    .update({ totp_enabled: true })
    .eq("user_id", session.userId);

  await auditLog({
    adminUserId: session.userId,
    action: "totp_enabled",
    ipAddress:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      undefined,
  });

  return NextResponse.json({ success: true });
}
