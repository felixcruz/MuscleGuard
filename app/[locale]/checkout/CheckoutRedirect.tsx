"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Shield, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Plan = "annual" | "monthly";

export function CheckoutRedirect({ annualAvailable = false }: { annualAvailable?: boolean }) {
  const t = useTranslations("checkout");
  const [plan, setPlan] = useState<Plan>(annualAvailable ? "annual" : "monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || t("somethingWentWrong"));
        setLoading(false);
      }
    } catch {
      setError(t("somethingWentWrong"));
      setLoading(false);
    }
  }

  const options: {
    id: Plan;
    name: string;
    price: string;
    per: string;
    sub: string;
    badge?: string;
  }[] = [
    ...(annualAvailable
      ? [
          {
            id: "annual" as Plan,
            name: t("planAnnualName"),
            price: t("annualPrice"),
            per: t("annualPer"),
            sub: t("annualEquiv"),
            badge: t("save"),
          },
        ]
      : []),
    {
      id: "monthly" as Plan,
      name: t("planMonthlyName"),
      price: t("monthlyPrice"),
      per: t("monthlyPer"),
      sub: t("monthlySub"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-[14px] border border-black/5 p-8">
        <div className="text-center">
          <Shield className="h-10 w-10 text-obsidian mx-auto mb-4" />
          <h1 className="text-xl font-bold text-obsidian">{t("choosePlanTitle")}</h1>
          <p className="text-sm text-mgray mt-1">{t("choosePlanDesc")}</p>
        </div>

        <div className="space-y-3 mt-6">
          {options.map((o) => {
            const selected = plan === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setPlan(o.id)}
                className={`w-full text-left rounded-[10px] border p-4 transition-colors ${
                  selected ? "border-obsidian ring-2 ring-obsidian/15" : "border-black/10 hover:border-black/25"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      selected ? "bg-obsidian border-obsidian" : "border-black/25"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-obsidian">{o.name}</span>
                      {o.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-[#CDFF00] text-obsidian px-2 py-0.5 rounded-full">
                          {o.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-mgray mt-0.5">{o.sub}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-obsidian leading-none">{o.price}</p>
                    <p className="text-[11px] text-mgray mt-1">{o.per}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <label className="flex items-start gap-3 mt-5 text-xs text-[#585A59] cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-obsidian"
          />
          <span>
            {t.rich("consent", {
              price:
                plan === "annual"
                  ? t("consentPriceAnnual")
                  : t("consentPriceMonthly"),
              terms: (chunks) => (
                <Link
                  href="/legal/terms"
                  target="_blank"
                  className="underline text-obsidian"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>

        <button
          onClick={startCheckout}
          disabled={loading || !agreed}
          className="w-full mt-4 py-3 bg-obsidian text-white text-sm font-semibold rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("redirecting")}
            </>
          ) : (
            t("startTrialCta")
          )}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-alert/10 border border-alert/20 rounded-lg text-sm text-obsidian text-center">
            {error}
          </div>
        )}

        <p className="text-xs text-muted mt-4 text-center">{t("noChargeToday")}</p>
      </div>
    </div>
  );
}
