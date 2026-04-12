"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      // Use configured APP_URL (set in environment variables).
      // If running on Vercel, this will always be https://muscle-guard.vercel.app
      // If not set, fall back to current browser origin for local development.
      let appUrl = process.env.NEXT_PUBLIC_APP_URL;

      if (!appUrl && typeof window !== 'undefined') {
        // Only use window.location.origin if NEXT_PUBLIC_APP_URL is not set
        appUrl = window.location.origin;
      }

      if (!appUrl) {
        throw new Error('Application URL is not configured');
      }

      const callbackUrl = redirectTo
        ? `${appUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
        : `${appUrl}/auth/callback`;

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl },
      });
      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send magic link";
      setError(message);
    } finally {
      setLoading(false);
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
      <Card className="w-full max-w-md rounded-[10px] border-black/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Shield className="h-10 w-10 text-obsidian" />
          </div>
          <CardTitle className="text-2xl font-medium tracking-tight text-obsidian">MuscleGuard</CardTitle>
          <CardDescription className="text-mgray">Your GLP-1 muscle protection coach</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-alert/10 border border-alert/20 rounded-lg text-obsidian text-sm">
              {error}
            </div>
          )}
          {sent ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-[#CDFF00]/20 flex items-center justify-center">
                  <span className="text-lg">✓</span>
                </div>
              </div>
              <p className="text-obsidian font-medium">Check your email!</p>
              <p className="text-sm text-mgray mt-1">
                We sent a magic link to <strong>{email}</strong>
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
                <Button type="submit" className="w-full bg-obsidian text-white hover:bg-obsidian-light rounded-lg" disabled={loading}>
                  {loading ? "Sending…" : "Send magic link"}
                </Button>
              </form>

            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
