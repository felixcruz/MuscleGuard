import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";
import { auditLog } from "@/lib/admin-audit";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, role } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const validRoles = ["user", "support", "admin", "super_admin"];
  const userRole = validRoles.includes(role) ? role : "user";

  const supabase = createAdminClient();

  // Create user in Supabase Auth (sends magic link invite)
  const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  if (!newUser.user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Create profile
  await supabase.from("profiles").upsert({
    id: newUser.user.id,
    role: userRole,
    subscription_status: "trial",
    onboarding_done: false,
  });

  await auditLog({
    adminUserId: session.userId,
    action: "create_user",
    targetType: "user",
    targetId: newUser.user.id,
    details: { email, role: userRole },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    user: { id: newUser.user.id, email },
  });
}
