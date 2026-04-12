"use client";

import { useState } from "react";
import {
  Shield,
  ExternalLink,
  Loader2,
  Check,
  Key,
  UserPlus,
} from "lucide-react";

interface EnvVar {
  name: string;
  configured: boolean;
  lastFour: string | null;
}

export default function AdminSettingsClient({
  totpEnabled: initialTotpEnabled,
  envStatus,
}: {
  totpEnabled: boolean;
  envStatus: EnvVar[];
}) {
  const [totpEnabled, setTotpEnabled] = useState(initialTotpEnabled);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUrl, setTotpUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpMessage, setTotpMessage] = useState<string | null>(null);

  // Create admin form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  async function handleGenerateTOTP() {
    setTotpLoading(true);
    setTotpMessage(null);
    try {
      const res = await fetch("/api/admin/settings/setup-totp", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setTotpSecret(data.secret);
        setTotpUrl(data.otpauthUrl);
      } else {
        setTotpMessage(data.error || "Failed to generate secret");
      }
    } catch {
      setTotpMessage("Network error");
    }
    setTotpLoading(false);
  }

  async function handleVerifyTOTP() {
    setTotpLoading(true);
    setTotpMessage(null);
    try {
      const res = await fetch("/api/admin/settings/setup-totp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setTotpEnabled(true);
        setTotpSecret(null);
        setTotpUrl(null);
        setTotpCode("");
        setTotpMessage("Two-factor authentication enabled successfully");
      } else {
        setTotpMessage(data.error || "Verification failed");
      }
    } catch {
      setTotpMessage("Network error");
    }
    setTotpLoading(false);
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMessage(null);

    try {
      const res = await fetch("/api/admin/settings/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateMessage(`Admin user created: ${newEmail}`);
        setNewEmail("");
        setNewPassword("");
      } else {
        setCreateMessage(data.error || "Failed to create admin");
      }
    } catch {
      setCreateMessage("Network error");
    }
    setCreateLoading(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* API Keys / Env Vars */}
      <div className="bg-white rounded-[10px] border border-black/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-4 w-4 text-obsidian" />
          <h3 className="text-sm font-medium text-obsidian">
            Environment Variables
          </h3>
        </div>
        <div className="space-y-2">
          {envStatus.map((env) => (
            <div
              key={env.name}
              className="flex items-center justify-between text-sm py-1.5 border-b border-black/5 last:border-0"
            >
              <span className="text-mgray font-mono text-xs">{env.name}</span>
              <span className="flex items-center gap-1.5">
                {env.configured ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs text-mgray font-mono">
                      ...{env.lastFour}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-alert font-medium">
                    Not set
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* External Links */}
      <div className="bg-white rounded-[10px] border border-black/5 p-5">
        <h3 className="text-sm font-medium text-obsidian mb-4">
          External Dashboards
        </h3>
        <div className="space-y-2">
          <ExternalLinkItem
            label="Vercel Dashboard"
            href="https://vercel.com/dashboard"
          />
          <ExternalLinkItem
            label="Supabase Dashboard"
            href="https://supabase.com/dashboard"
          />
          <ExternalLinkItem
            label="Stripe Dashboard"
            href="https://dashboard.stripe.com"
          />
          <ExternalLinkItem
            label="Anthropic Console"
            href="https://console.anthropic.com"
          />
        </div>
      </div>

      {/* TOTP Setup */}
      <div className="bg-white rounded-[10px] border border-black/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-obsidian" />
          <h3 className="text-sm font-medium text-obsidian">
            Two-Factor Authentication
          </h3>
        </div>

        {totpEnabled && !totpSecret ? (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Check className="h-4 w-4" />
            2FA is enabled
          </div>
        ) : totpSecret && totpUrl ? (
          <div className="space-y-3">
            <p className="text-sm text-mgray">
              Scan this secret in your authenticator app:
            </p>
            <div className="bg-surface p-3 rounded-lg">
              <p className="font-mono text-xs text-obsidian break-all select-all">
                {totpSecret}
              </p>
            </div>
            <p className="text-xs text-mgray">
              Or use this URL:
            </p>
            <div className="bg-surface p-3 rounded-lg">
              <p className="font-mono text-[10px] text-obsidian break-all select-all">
                {totpUrl}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-mgray">
                Enter the 6-digit code to verify
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  className="flex-1 h-9 px-3 rounded-lg border border-black/10 bg-white text-sm text-center tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-obsidian/10"
                />
                <button
                  onClick={handleVerifyTOTP}
                  disabled={totpLoading || totpCode.length !== 6}
                  className="h-9 px-4 bg-obsidian text-white rounded-lg text-sm font-medium hover:bg-obsidian-light disabled:opacity-50 flex items-center gap-1.5"
                >
                  {totpLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Verify
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-mgray mb-3">
              Add an extra layer of security to your admin account.
            </p>
            <button
              onClick={handleGenerateTOTP}
              disabled={totpLoading}
              className="h-9 px-4 bg-obsidian text-white rounded-lg text-sm font-medium hover:bg-obsidian-light disabled:opacity-50 flex items-center gap-1.5"
            >
              {totpLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Set Up 2FA
            </button>
          </div>
        )}

        {totpMessage && (
          <p className="mt-3 text-sm text-obsidian bg-surface p-2 rounded-lg">
            {totpMessage}
          </p>
        )}
      </div>

      {/* Create Admin */}
      <div className="bg-white rounded-[10px] border border-black/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-4 w-4 text-obsidian" />
          <h3 className="text-sm font-medium text-obsidian">
            Create Admin User
          </h3>
        </div>
        <form onSubmit={handleCreateAdmin} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-mgray">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className="mt-1 w-full h-9 px-3 rounded-lg border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-mgray">
              Password (min 12 chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={12}
              placeholder="Minimum 12 characters"
              className="mt-1 w-full h-9 px-3 rounded-lg border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-mgray">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-lg border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/10"
            >
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={createLoading}
            className="w-full h-9 px-4 bg-obsidian text-white rounded-lg text-sm font-medium hover:bg-obsidian-light disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {createLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Create Admin
          </button>
        </form>

        {createMessage && (
          <p className="mt-3 text-sm text-obsidian bg-surface p-2 rounded-lg">
            {createMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function ExternalLinkItem({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-surface transition-colors group"
    >
      <span className="text-obsidian">{label}</span>
      <ExternalLink className="h-3.5 w-3.5 text-muted group-hover:text-obsidian transition-colors" />
    </a>
  );
}
