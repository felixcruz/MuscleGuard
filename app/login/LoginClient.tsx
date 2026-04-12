"use client";

import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Shield, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (authError) throw authError;
      setStep("code");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send code";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    if (pasted.length === 6) {
      handleVerifyCode(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  }

  async function handleVerifyCode(fullCode: string) {
    setVerifying(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: fullCode,
        type: "email",
      });
      if (verifyError) throw verifyError;

      // Success — redirect
      const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
      router.push(target);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid code";
      setError(message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md mb-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-mgray hover:text-obsidian transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
      <div className="w-full max-w-md bg-white rounded-[10px] border border-black/5 overflow-hidden">
        <div className="text-center pt-8 pb-4 px-6">
          <div className="flex justify-center mb-2">
            <Shield className="h-10 w-10 text-obsidian" />
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-obsidian">MuscleGuard</h1>
          <p className="text-mgray text-sm mt-1">Your GLP-1 muscle protection coach</p>
        </div>

        <div className="px-6 pb-8 space-y-4">
          {error && (
            <div className="p-3 bg-alert/10 border border-alert/20 rounded-lg text-obsidian text-sm">
              {error}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-obsidian">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50"
              >
                {loading ? "Sending…" : "Continue with email"}
              </button>
            </form>
          )}

          {step === "code" && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-obsidian font-medium">Enter the 6-digit code</p>
                <p className="text-xs text-mgray mt-1">
                  We sent a code to <strong>{email}</strong>
                </p>
              </div>

              {/* Code inputs */}
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    disabled={verifying}
                    className="w-11 h-13 text-center text-xl font-bold border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-obsidian/20 focus:border-obsidian bg-white text-obsidian disabled:opacity-50"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {verifying && (
                <p className="text-center text-sm text-mgray">Verifying…</p>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); setError(null); }}
                  className="text-xs text-mgray hover:text-obsidian transition-colors"
                >
                  Use a different email
                </button>
                <button
                  onClick={(e) => { handleSendCode(e as unknown as React.FormEvent); }}
                  disabled={loading}
                  className="text-xs text-mgray hover:text-obsidian transition-colors"
                >
                  {loading ? "Sending…" : "Resend code"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
