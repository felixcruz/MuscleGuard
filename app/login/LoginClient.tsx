"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${appUrl}/auth/callback` },
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Shield className="h-10 w-10 text-brand-600" />
          </div>
          <CardTitle className="text-2xl">MuscleGuard</CardTitle>
          <CardDescription>Your GLP-1 muscle protection coach</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {sent ? (
            <div className="text-center py-6">
              <p className="text-brand-700 font-medium">Check your email!</p>
              <p className="text-sm text-gray-500 mt-1">
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
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
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
