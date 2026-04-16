"use client";

import { useTranslations } from "next-intl";

interface Props {
  goalG: number;
  loggedG: number;
}

export function ProteinRing({ goalG, loggedG }: Props) {
  const t = useTranslations("dashboard");
  const pct = goalG > 0 ? Math.min(1, loggedG / goalG) : 0;
  const radius = 72;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference * (1 - pct);
  const remaining = Math.max(0, goalG - loggedG);

  const progressColor = pct >= 0.9 ? "#CDFF00" : pct >= 0.5 ? "#CDFF00" : pct >= 0.25 ? "#CDFF00" : "#585A59";
  const trackColor = "rgba(255,255,255,0.08)";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke={trackColor} strokeWidth={stroke} />
          <circle
            cx={radius} cy={radius} r={normalizedRadius}
            fill="none" stroke={progressColor} strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {pct >= 0.9 ? (
            <span className="text-3xl text-[#CDFF00]">✓</span>
          ) : (
            <>
              <span className="text-3xl font-bold text-white">{remaining}g</span>
              <span className="text-[10px] text-white/50">{t("proteinRemaining")}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-white/40">{loggedG}g of {goalG}g</p>
      </div>
    </div>
  );
}
