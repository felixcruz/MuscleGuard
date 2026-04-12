export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";
import AdminSettingsClient from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  if (session.role !== "super_admin") {
    redirect("/admin");
  }

  const supabase = createAdminClient();

  // Get TOTP status
  const { data: creds } = await supabase
    .from("admin_credentials")
    .select("totp_enabled")
    .eq("user_id", session.userId)
    .single();

  // Check which env vars are configured
  const envVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "ANTHROPIC_API_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];

  const envStatus = envVars.map((name) => ({
    name,
    configured: !!process.env[name],
    lastFour: process.env[name]
      ? process.env[name]!.slice(-4)
      : null,
  }));

  return (
    <div className="min-h-screen bg-surface">
      <AdminNav email={session.email} role={session.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-obsidian rounded-[14px] p-6 mb-6">
          <h1 className="text-lg font-medium text-white">Settings</h1>
          <p className="text-sm text-white/60 mt-1">
            Super admin configuration
          </p>
        </div>

        <AdminSettingsClient
          totpEnabled={creds?.totp_enabled ?? false}
          envStatus={envStatus}
        />
      </div>
    </div>
  );
}
