"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export function CheckoutRedirect() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function redirectToStripe() {
      try {
        const res = await fetch("/api/stripe/checkout", { method: "POST" });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error || "Failed to start checkout");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    }
    redirectToStripe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-white rounded-[14px] border border-black/5 p-8 text-center">
        <Shield className="h-10 w-10 text-obsidian mx-auto mb-4" />
        <h1 className="text-xl font-bold text-obsidian mb-2">Starting your free trial</h1>
        <p className="text-sm text-mgray mb-6">
          You will be redirected to our secure payment partner to start your 7-day free trial. You will not be charged today.
        </p>

        {error ? (
          <div className="space-y-3">
            <div className="p-3 bg-alert/10 border border-alert/20 rounded-lg text-sm text-obsidian">
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-mgray">
            <div className="w-4 h-4 border-2 border-obsidian border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Redirecting to checkout…</span>
          </div>
        )}

        <p className="text-xs text-muted mt-6">
          $14.99/month after 7-day trial · Cancel anytime
        </p>
      </div>
    </div>
  );
}
