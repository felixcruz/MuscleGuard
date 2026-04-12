import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";
import { auditLog } from "@/lib/admin-audit";
import { brandedEmail } from "@/lib/email-template";

async function sendInviteEmail(to: string, loginUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const html = brandedEmail({
    title: "You've been invited to MuscleGuard",
    body: `<p style="margin:0 0 8px">Someone has created an account for you on MuscleGuard, the GLP-1 muscle protection companion.</p>
<p style="margin:0">Click the button below to sign in and start protecting your muscle during weight loss.</p>`,
    ctaText: "Sign in to MuscleGuard",
    ctaUrl: loginUrl,
    footer: "This link expires in 24 hours. If you didn't expect this invitation, you can safely ignore this email.",
  });

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "MuscleGuard <noreply@muscleguard.app>",
      to,
      subject: "You've been invited to MuscleGuard",
      html,
    }),
  });
}

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

  await supabase.from("profiles").upsert({
    id: newUser.user.id,
    role: userRole,
    subscription_status: "trial",
    onboarding_done: false,
  });

  // Generate magic link for the user
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://muscleguard.app";
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });

  // Send branded invite email with direct login link
  if (linkData?.properties?.action_link) {
    await sendInviteEmail(email, linkData.properties.action_link);
  } else {
    // Fallback: send to login page
    await sendInviteEmail(email, `${appUrl}/login`);
  }

  await auditLog({
    adminUserId: session.userId,
    action: "create_user",
    targetType: "user",
    targetId: newUser.user.id,
    details: { email, role: userRole, invite_sent: true },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    user: { id: newUser.user.id, email },
  });
}
