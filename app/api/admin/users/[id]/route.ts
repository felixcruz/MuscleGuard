import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";
import { auditLog } from "@/lib/admin-audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get email
  const { data: userData } = await supabase.auth.admin.getUserById(id);

  // Get recent food logs
  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get recent workout logs
  const { data: workoutLogs } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", id)
    .order("completed_at", { ascending: false })
    .limit(20);

  // Get recent medication logs
  const { data: medicationLogs } = await supabase
    .from("medication_logs")
    .select("*")
    .eq("user_id", id)
    .order("taken_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    user: {
      ...profile,
      email: userData.user?.email ?? "",
    },
    foodLogs: foodLogs ?? [],
    workoutLogs: workoutLogs ?? [],
    medicationLogs: medicationLogs ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const allowedFields = [
    "role",
    "subscription_status",
    "onboarding_completed",
  ];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }

  await auditLog({
    adminUserId: session.userId,
    action: "user_updated",
    targetType: "user",
    targetId: id,
    details: updateData,
    ipAddress:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      undefined,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Delete from profiles first (cascade should handle related data)
  await supabase.from("profiles").delete().eq("id", id);

  // Delete from auth
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }

  await auditLog({
    adminUserId: session.userId,
    action: "user_deleted",
    targetType: "user",
    targetId: id,
    ipAddress:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      undefined,
  });

  return NextResponse.json({ success: true });
}
