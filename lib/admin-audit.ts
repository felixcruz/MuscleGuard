import { createAdminClient } from "./supabase/admin";

export async function auditLog(params: {
  adminUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const supabase = createAdminClient();
  await supabase.from("admin_audit_log").insert({
    admin_user_id: params.adminUserId,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    details: params.details ?? null,
    ip_address: params.ipAddress ?? null,
  });
}
