"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

export function CheckoutRedirect() {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
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
        setError(t("somethingWentWrong"));
      }
    }
    redirectToStripe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-white rounded-[14px] border border-black/5 p-8 text-center">
        <Shield className="h-10 w-10 text-obsidian mx-auto mb-4" />
        <h1 className="text-xl font-bold text-obsidian mb-2">{t("startingTrial")}</h1>
        <p className="text-sm text-mgray mb-6">
          {t("redirectDesc")}
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
              {tc("tryAgain")}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-mgray">
            <div className="w-4 h-4 border-2 border-obsidian border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t("redirecting")}</span>
          </div>
        )}

        <p className="text-xs text-muted mt-6">
          {t("priceInfo")}
        </p>
      </div>
    </div>
  );
}
