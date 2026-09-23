"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, ArrowRight } from "lucide-react";

type Plan = "annual" | "monthly";

export function PricingToggle({
  features,
  annualAvailable = false,
}: {
  features: string[];
  annualAvailable?: boolean;
}) {
  const t = useTranslations("landing");
  const tCheckout = useTranslations("checkout");
  const tc = useTranslations("common");
  const [plan, setPlan] = useState<Plan>(annualAvailable ? "annual" : "monthly");

  const isAnnual = plan === "annual";

  return (
    <div className="rounded-[10px] bg-white border border-black/5 overflow-hidden">
      <div className="bg-[#CDFF00] text-[#131413] text-center py-2.5 text-sm font-medium tracking-wide">
        {t("trialBanner")}
      </div>
      <div className="p-8">
        <h3 className="text-lg font-medium text-[#131413]">{t("proPlan")}</h3>

        {/* Monthly / Annual switch */}
        {annualAvailable && (
          <div className="mt-4 inline-flex rounded-full bg-[#f0f0f0] p-1 text-sm">
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
                !isAnnual ? "bg-white text-[#131413] shadow-sm" : "text-[#585A59]"
              }`}
            >
              {tCheckout("planMonthlyName")}
            </button>
            <button
              type="button"
              onClick={() => setPlan("annual")}
              className={`px-4 py-1.5 rounded-full font-medium transition-colors inline-flex items-center gap-1.5 ${
                isAnnual ? "bg-white text-[#131413] shadow-sm" : "text-[#585A59]"
              }`}
            >
              {tCheckout("planAnnualName")}
              <span className="text-[10px] font-bold uppercase tracking-wide bg-[#CDFF00] text-[#131413] px-1.5 py-0.5 rounded-full">
                {tCheckout("save")}
              </span>
            </button>
          </div>
        )}

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-5xl font-medium text-[#131413]">
            {isAnnual ? tCheckout("annualPrice") : t("proPrice")}
          </span>
          <span className="text-[#585A59]">
            {isAnnual ? t("perYear") : t("perMonth")}
          </span>
        </div>
        <p className="text-sm text-[#585A59] mt-1">
          {isAnnual ? tCheckout("annualEquiv") : t("afterTrial")}
        </p>

        <ul className="mt-8 space-y-4">
          {features.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-[#585A59]">
              <Check className="h-5 w-5 text-[#131413] shrink-0 opacity-50" />
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 mt-8 w-full py-3.5 bg-[#131413] text-white font-medium rounded-lg hover:bg-[#202222] transition-colors"
        >
          {tc("startFreeTrial")} <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-xs text-[#BFC1C0] text-center mt-3">{t("cancelFromSettings")}</p>
      </div>
    </div>
  );
}
