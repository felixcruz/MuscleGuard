// Server-side helper to validate admin session from cookies
import { cookies } from "next/headers";
import { createAdminClient } from "./supabase/admin";
import { hashToken } from "./admin-auth";

export async function getAdminSession(): Promise<{
  userId: string;
  role: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return null;

  const supabase = createAdminClient();
  const tokenHash = hashToken(token);

  const { data: session } = await supabase
    .from("admin_sessions")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) return null;

  // Get user role and email
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user_id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) return null;

  const { data: userData } = await supabase.auth.admin.getUserById(
    session.user_id
  );

  return {
    userId: session.user_id,
    role: profile.role,
    email: userData.user?.email ?? "",
  };
}
