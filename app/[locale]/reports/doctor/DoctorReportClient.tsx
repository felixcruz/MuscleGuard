"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Download, Loader2, ShieldCheck } from "lucide-react";

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

interface DoctorReport {
  patient: { name: string | null; medication: string; doseMg: number | null; frequency: string | null };
  window: { start: string; end: string; days: number };
  stats: Stats;
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

export function DoctorReportClient() {
  const t = useTranslations("doctorReport");
  const locale = useLocale();
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reports/doctor-summary?locale=${locale}`, {
          method: "POST",
        });
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
        <a
          href={`/${locale}/reports`}
          className="inline-block mt-4 text-sm font-medium text-obsidian underline"
        >
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
      {/* Print isolation: only #doctor-report prints, no app chrome. */}
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          body * { visibility: hidden !important; }
          #doctor-report, #doctor-report * { visibility: visible !important; }
          #doctor-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Screen-only action bar */}
        <div className="no-print flex items-center justify-between mb-5">
          <a
            href={`/${locale}/reports`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mgray hover:text-obsidian"
          >
            <ArrowLeft className="h-4 w-4" /> {t("back")}
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-obsidian px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Download className="h-4 w-4" /> {t("download")}
          </button>
        </div>

        {/* The printable document */}
        <div
          id="doctor-report"
          className="bg-white border border-black/10 rounded-[14px] p-8 sm:p-10 text-obsidian"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-black/10 pb-5">
            <div>
              <p className="text-lg font-bold tracking-tight">MuscleGuard</p>
              <h1 className="text-xl font-semibold mt-2">{t("title")}</h1>
              <p className="text-sm text-mgray mt-1">{t("subtitle")}</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-[#8a8f98] shrink-0" />
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

          {/* Metrics */}
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

          {/* AI summary */}
          <div className="mt-7">
            <p className="text-[11px] uppercase tracking-widest text-mgray mb-2">{t("summaryTitle")}</p>
            <div className="text-[15px] leading-relaxed space-y-3">
              {report.summary.split("\n").filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* Share-with-doctor note */}
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
