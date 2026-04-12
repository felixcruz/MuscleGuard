import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/admin-auth";
import { auditLog } from "@/lib/admin-audit";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;

  if (token) {
    const supabase = createAdminClient();
    const tokenHash = hashToken(token);

    // Get session to find user for audit log
    const { data: session } = await supabase
      .from("admin_sessions")
      .select("user_id")
      .eq("token_hash", tokenHash)
      .single();

    // Delete session
    await supabase
      .from("admin_sessions")
      .delete()
      .eq("token_hash", tokenHash);

    if (session) {
      await auditLog({
        adminUserId: session.user_id,
        action: "logout",
        ipAddress:
          request.headers.get("x-forwarded-for") ??
          request.headers.get("x-real-ip") ??
          undefined,
      });
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
