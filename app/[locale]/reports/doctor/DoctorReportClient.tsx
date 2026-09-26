"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface Stats {
  proteinGoalG: number;
  daysLogged: number;
  daysHit: number;
  avgProteinLoggedDays: number;
  workoutsCount: number;
  firstWeight: number | null;
  lastWeight: number | null;
  weightChange: number | null;
}

interface Trends {
  proteinTrend: "up" | "down" | "flat";
  firstHalfAvgProtein: number;
  secondHalfAvgProtein: number;
  adherencePct: number;
  avgProteinPctOfGoal: number;
  loggingPct: number;
  weightRatePerWeek: number | null;
}

interface WeekBucket {
  index: number;
  start: string;
  end: string;
  daysLogged: number;
  daysHit: number;
  avgProtein: number;
  workouts: number;
  weightEnd: number | null;
}

interface DoctorReport {
  patient: { name: string | null; medication: string; doseMg: number | null; frequency: string | null };
  window: { start: string; end: string; days: number };
  stats: Stats;
  trends: Trends;
  weekly: WeekBucket[];
  summary: string;
  generatedAt: string;
}

function fmtDate(d: string, locale: string) {
  return new Date(d + "T12:00:00Z").toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function fmtShort(d: string, locale: string) {
  return new Date(d + "T12:00:00Z").toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function TrendBadge({ trend, t }: { trend: "up" | "down" | "flat"; t: (k: string) => string }) {
  const cfg = {
    up: { Icon: TrendingUp, cls: "text-[#1a7f37]", label: t("trendUp") },
    down: { Icon: TrendingDown, cls: "text-[#b3261e]", label: t("trendDown") },
    flat: { Icon: Minus, cls: "text-mgray", label: t("trendFlat") },
  }[trend];
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.cls}`}>
      <Icon className="h-3.5 w-3.5" /> {cfg.label}
    </span>
  );
}

export function DoctorReportClient() {
  const t = useTranslations("doctorReport");
  const locale = useLocale();
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reports/doctor-summary?locale=${locale}`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "error");
        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-mgray">{t("errorMsg")}</p>
        <a href={`/${locale}/reports`} className="inline-block mt-4 text-sm font-medium text-obsidian underline">
          {t("back")}
        </a>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center text-center">
        <Loader2 className="h-6 w-6 text-obsidian animate-spin" />
        <p className="text-mgray mt-3 text-sm">{t("loading")}</p>
      </div>
    );
  }

  const s = report.stats;
  const tr = report.trends;
  const goal = s.proteinGoalG || 1;

  // Reference metrics (raw)
  const metrics = [
    { label: t("proteinTarget"), value: `${s.proteinGoalG} g` },
    { label: t("daysLogged"), value: `${s.daysLogged} / 30` },
    { label: t("daysHit"), value: `${s.daysHit} / 30` },
    { label: t("avgProtein"), value: s.daysLogged ? `${s.avgProteinLoggedDays} g` : "—" },
    { label: t("workouts"), value: `${s.workoutsCount}` },
    {
      label: t("weightChange"),
      value: s.weightChange != null ? `${s.weightChange > 0 ? "+" : ""}${s.weightChange} kg` : "—",
    },
  ];

  return (
    <>
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          body * { visibility: hidden !important; }
          #doctor-report, #doctor-report * { visibility: visible !important; }
          #doctor-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="no-print flex items-center justify-between mb-5">
          <a href={`/${locale}/reports`} className="inline-flex items-center gap-1.5 text-sm font-medium text-mgray hover:text-obsidian">
            <ArrowLeft className="h-4 w-4" /> {t("back")}
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-obsidian px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Download className="h-4 w-4" /> {t("download")}
          </button>
        </div>

        <div id="doctor-report" className="bg-white border border-black/10 rounded-[14px] p-8 sm:p-10 text-obsidian">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-black/10 pb-5">
            <div>
              <p className="text-lg font-bold tracking-tight">Stoova</p>
              <h1 className="text-xl font-semibold mt-2">{t("title")}</h1>
              <p className="text-sm text-mgray mt-1">{t("subtitle")}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 text-sm">
            {report.patient.name && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-mgray">{t("forPatient")}</p>
                <p className="font-medium mt-0.5">{report.patient.name}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-mgray">{t("period")}</p>
              <p className="font-medium mt-0.5">
                {fmtDate(report.window.start, locale)} – {fmtDate(report.window.end, locale)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-mgray">{t("medication")}</p>
              <p className="font-medium mt-0.5">
                {report.patient.medication}
                {report.patient.doseMg ? `, ${report.patient.doseMg} mg` : ""}
              </p>
            </div>
          </div>

          {/* At a glance — analysis */}
          <div className="mt-7">
            <p className="text-[11px] uppercase tracking-widest text-mgray mb-3">{t("glanceTitle")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-[10px] border border-black/10 p-4">
                <p className="text-xs text-mgray">{t("adherenceGlance")}</p>
                <p className="text-2xl font-bold leading-none mt-1.5">{tr.adherencePct}%</p>
                <div className="mt-2"><TrendBadge trend={tr.proteinTrend} t={t} /></div>
              </div>
              <div className="rounded-[10px] border border-black/10 p-4">
                <p className="text-xs text-mgray">{t("avgVsGoal")}</p>
                <p className="text-2xl font-bold leading-none mt-1.5">{tr.avgProteinPctOfGoal}%</p>
                <p className="text-xs text-mgray mt-2">{s.avgProteinLoggedDays} g · {t("target")} {s.proteinGoalG} g</p>
              </div>
              <div className="rounded-[10px] border border-black/10 p-4">
                <p className="text-xs text-mgray">{t("weightPace")}</p>
                <p className="text-2xl font-bold leading-none mt-1.5">
                  {tr.weightRatePerWeek != null ? `${tr.weightRatePerWeek > 0 ? "+" : ""}${tr.weightRatePerWeek}` : "—"}
                  {tr.weightRatePerWeek != null && <span className="text-sm font-medium text-mgray"> {t("kgPerWeek")}</span>}
                </p>
                {s.firstWeight != null && s.lastWeight != null && (
                  <p className="text-xs text-mgray mt-2">{s.firstWeight} → {s.lastWeight} kg</p>
                )}
              </div>
            </div>
          </div>

          {/* 4-week trajectory */}
          <div className="mt-7">
            <p className="text-[11px] uppercase tracking-widest text-mgray mb-3">{t("trajectoryTitle")}</p>
            <div className="space-y-2.5">
              {report.weekly.map((w) => {
                const pct = Math.min(100, Math.round((w.avgProtein / goal) * 100));
                return (
                  <div key={w.index} className="flex items-center gap-3">
                    <div className="w-24 shrink-0 text-xs text-mgray">
                      {t("week")} {w.index}
                      <span className="block text-[10px] text-muted">{fmtShort(w.start, locale)}</span>
                    </div>
                    <div className="flex-1 h-6 bg-surface rounded-md overflow-hidden relative border border-black/5">
                      <div className="h-full bg-obsidian/85" style={{ width: `${pct}%` }} />
                      <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-medium text-obsidian">
                        {w.daysLogged ? `${w.avgProtein} g` : t("noData")}
                      </span>
                    </div>
                    <div className="w-28 shrink-0 text-right text-[11px] text-mgray">
                      {w.daysHit}/{w.daysLogged || 0} {t("onTarget")} · {w.workouts} 🏋
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted mt-2">{t("trajectoryHint", { goal: s.proteinGoalG })}</p>
          </div>

          {/* AI analysis */}
          <div className="mt-7">
            <p className="text-[11px] uppercase tracking-widest text-mgray mb-2">{t("summaryTitle")}</p>
            <div className="text-[15px] leading-relaxed space-y-3">
              {report.summary.split("\n").filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* Reference metrics */}
          <div className="mt-7">
            <p className="text-[11px] uppercase tracking-widest text-mgray mb-3">{t("metricsTitle")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-[10px] border border-black/10 p-4">
                  <p className="text-2xl font-bold leading-none">{m.value}</p>
                  <p className="text-xs text-mgray mt-2 leading-snug">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Share note */}
          <div className="mt-7 rounded-[10px] bg-surface border border-black/10 p-5">
            <p className="font-semibold text-sm">{t("shareTitle")}</p>
            <p className="text-sm text-mgray mt-1.5 leading-relaxed">{t("shareBody")}</p>
          </div>

          {/* Disclaimer */}
          <p className="text-[11px] text-mgray leading-relaxed mt-6 border-t border-black/10 pt-4">
            {t("disclaimer")}
          </p>
        </div>
      </div>
    </>
  );
}
