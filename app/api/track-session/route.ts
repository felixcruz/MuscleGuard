import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Only log once per hour to avoid spam
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("user_activity_log")
    .select("id")
    .eq("user_id", user.id)
    .eq("action", "app_opened")
    .gte("created_at", oneHourAgo)
    .limit(1);

  if (recent && recent.length > 0) {
    return NextResponse.json({ tracked: false, reason: "recent" });
  }

  await admin.from("user_activity_log").insert({
    user_id: user.id,
    action: "app_opened",
    changed_fields: null,
  });

  return NextResponse.json({ tracked: true });
}
