import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";
import { hashPassword } from "@/lib/admin-auth";
import { auditLog } from "@/lib/admin-audit";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email?: string; password?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password, role } = body;

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: "Email, password, and role are required" },
      { status: 400 }
    );
  }

  if (password.length < 12) {
    return NextResponse.json(
      { error: "Password must be at least 12 characters" },
      { status: 400 }
    );
  }

  if (!["admin", "super_admin"].includes(role)) {
    return NextResponse.json(
      { error: "Role must be admin or super_admin" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Create user via Supabase auth admin
  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create user" },
      { status: 500 }
    );
  }

  // Create profile
  await supabase.from("profiles").upsert({
    id: newUser.user.id,
    role,
    full_name: email.split("@")[0],
    onboarding_completed: true,
  });

  // Create admin credentials
  const passwordHash = await hashPassword(password);
  await supabase.from("admin_credentials").insert({
    user_id: newUser.user.id,
    password_hash: passwordHash,
    totp_enabled: false,
    failed_attempts: 0,
  });

  await auditLog({
    adminUserId: session.userId,
    action: "admin_created",
    targetType: "user",
    targetId: newUser.user.id,
    details: { email, role },
    ipAddress:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      undefined,
  });

  return NextResponse.json({
    success: true,
    userId: newUser.user.id,
  });
}
