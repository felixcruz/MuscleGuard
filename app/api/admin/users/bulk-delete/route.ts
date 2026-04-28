import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";
import { auditLog } from "@/lib/admin-audit";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { ids: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "No user IDs provided" }, { status: 400 });
  }

  // Prevent deleting yourself
  if (body.ids.includes(session.userId)) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ipAddress =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    undefined;

  const errors: string[] = [];
  const deleted: string[] = [];

  for (const id of body.ids) {
    // Delete profile first (cascade handles related data)
    await supabase.from("profiles").delete().eq("id", id);

    // Delete from auth
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      errors.push(id);
    } else {
      deleted.push(id);
    }
  }

  if (deleted.length > 0) {
    await auditLog({
      adminUserId: session.userId,
      action: "bulk_users_deleted",
      targetType: "user",
      targetId: deleted.join(","),
      details: { count: deleted.length, ids: deleted },
      ipAddress,
    });
  }

  return NextResponse.json({
    deleted: deleted.length,
    errors: errors.length,
    failedIds: errors,
  });
}
