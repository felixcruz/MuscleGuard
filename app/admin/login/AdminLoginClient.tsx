"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

export default function AdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requiresTOTP, setRequiresTOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLockMessage(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          totp_code: requiresTOTP ? totpCode : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.lockedMinutes) {
          setLockMessage(
            `Account locked. Try again in ${data.lockedMinutes} minute${data.lockedMinutes === 1 ? "" : "s"}.`
          );
        } else {
          setError(data.error || "Login failed");
        }
        return;
      }

      if (data.requiresTOTP) {
        setRequiresTOTP(true);
        return;
      }

      // Success
      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[10px] border border-black/5 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Shield className="h-10 w-10 text-obsidian" />
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-obsidian">
              Admin Login
            </h1>
            <p className="text-sm text-mgray mt-1">MuscleGuard Dashboard</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-alert/10 border border-alert/20 rounded-lg text-obsidian text-sm">
              {error}
            </div>
          )}

          {lockMessage && (
            <div className="mb-4 p-3 bg-alert/10 border border-alert/20 rounded-lg text-obsidian text-sm">
              {lockMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiresTOTP ? (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-obsidian"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@muscleguard.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-obsidian"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Min 12 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={12}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian/20"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label
                  htmlFor="totp"
                  className="text-sm font-medium text-obsidian"
                >
                  Two-Factor Code
                </label>
                <p className="text-xs text-mgray">
                  Enter the 6-digit code from your authenticator app
                </p>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  autoFocus
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-center tracking-[0.3em] font-mono placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian/20"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-obsidian text-white rounded-lg text-sm font-medium hover:bg-obsidian-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {requiresTOTP ? "Verify" : "Sign In"}
            </button>

            {requiresTOTP && (
              <button
                type="button"
                onClick={() => {
                  setRequiresTOTP(false);
                  setTotpCode("");
                }}
                className="w-full text-sm text-mgray hover:text-obsidian transition-colors"
              >
                Back to login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
