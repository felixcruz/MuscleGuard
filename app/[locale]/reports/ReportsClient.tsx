"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, ChevronDown, ChevronRight, BarChart2 } from "lucide-react";
import type { WeeklyReportData } from "@/lib/weekly-report";

interface CurrentWeek {
  weekStart: string;
  weekEnd: string;
  proteinDaysHit: number;
  daysElapsed: number;
  workoutsCount: number;
  totalProteinG: number;
}

interface Props {
  userId: string;
  reports: WeeklyReportData[];
  proteinGoalG: number;
  currentWeek: CurrentWeek;
  lastWeekReportExists: boolean;
  lastWeekStart: string;
  lastWeekEnd: string;
  isSunday: boolean;
}

function formatWeek(weekStart: string, weekEnd: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = new Date(weekStart + "T12:00:00Z").toLocaleDateString("en-US", opts);
  const e = new Date(weekEnd + "T12:00:00Z").toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  });
  return `${s} – ${e}`;
}

function gradeConfig(grade: string) {
  if (grade === "A") return { bg: "bg-[#CDFF00]", ring: "ring-[#CDFF00]/30", emoji: "🏆" };
  if (grade === "B") return { bg: "bg-obsidian", ring: "ring-obsidian/10", emoji: "⭐" };
  return { bg: "bg-[#FFB4AB]", ring: "ring-[#FFB4AB]/30", emoji: "📈" };
}

function ReportCard({ report, t }: { report: WeeklyReportData; t: ReturnType<typeof useTranslations> }) {
  const [expanded, setExpanded] = useState(false);
  const g = gradeConfig(report.grade);
  const proteinPct = Math.round((report.protein_days_hit / 7) * 100);
  const workoutPct = Math.min(100, Math.round((report.workouts_count / 3) * 100));

  return (
    <div className="bg-white border border-black/5 rounded-[10px] overflow-hidden">
      {/* Header row */}
      <div className="p-5 flex items-center gap-4">
        {/* Grade circle */}
        <div className={`w-14 h-14 rounded-full ${g.bg} ring-4 ${g.ring} flex items-center justify-center shrink-0`}>
          <span className={`text-2xl font-bold ${report.grade === "B" ? "text-white" : "text-obsidian"}`}>
            {report.grade}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-obsidian">
              {formatWeek(report.week_start, report.week_end)}
            </p>
            <span className="text-xs text-mgray font-medium">
              {Math.round(report.score)}/100
            </span>
          </div>

          {/* Score bar */}
          <div className="h-2 bg-surface rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-obsidian transition-all duration-500"
              style={{ width: `${Math.min(100, report.score)}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mt-2 text-xs text-mgray">
            <span>🥩 <span className="font-medium text-obsidian">{report.protein_days_hit}</span>/7 {t("proteinDaysCount")}</span>
            <span>🏋️ <span className="font-medium text-obsidian">{report.workouts_count}</span> {t("workouts").toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* Summary (expandable) */}
      <div className="border-t border-black/5">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface transition-colors"
        >
          <span className="text-xs text-mgray font-medium">{t("weeklySummary")}</span>
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted" />
            : <ChevronRight className="h-4 w-4 text-muted" />
          }
        </button>
        {expanded && (
          <div className="px-5 pb-4">
            <p className="text-sm text-mgray leading-relaxed">{report.summary_text}</p>

            {/* Detailed breakdown */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-mgray uppercase tracking-widest">{t("proteinConsistency")}</p>
                <div className="flex items-end gap-1.5 mt-1">
                  <span className="text-xl font-bold text-obsidian">{proteinPct}%</span>
                  <span className="text-xs text-mgray mb-0.5">{report.protein_days_hit} {t("ofDays")}</span>
                </div>
                <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-obsidian" style={{ width: `${proteinPct}%` }} />
                </div>
              </div>
              <div className="bg-surface rounded-lg p-3">
                <p className="text-[10px] text-mgray uppercase tracking-widest">{t("workoutCompletion")}</p>
                <div className="flex items-end gap-1.5 mt-1">
                  <span className="text-xl font-bold text-obsidian">{workoutPct}%</span>
                  <span className="text-xs text-mgray mb-0.5">{report.workouts_count} {t("ofTarget")}</span>
                </div>
                <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-obsidian" style={{ width: `${workoutPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReportsClient({
  userId,
  reports,
  proteinGoalG,
  currentWeek,
  lastWeekReportExists,
  lastWeekStart,
  lastWeekEnd,
  isSunday,
}: Props) {
  const t = useTranslations("reports");
  const [generating, setGenerating] = useState(false);
  const [liveReports, setLiveReports] = useState<WeeklyReportData[]>(reports);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: lastWeekStart, weekEnd: lastWeekEnd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setLiveReports((prev) => {
        const exists = prev.some((r) => r.week_start === data.report.week_start);
        if (exists) return prev;
        return [data.report, ...prev];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  const showGenerateButton =
    !lastWeekReportExists &&
    !liveReports.some((r) => r.week_start === lastWeekStart);

  // Current week projected grade
  const projectedProtein = Math.round((currentWeek.proteinDaysHit / currentWeek.daysElapsed) * 7);
  const projectedScore = Math.round(
    ((currentWeek.proteinDaysHit / Math.max(1, currentWeek.daysElapsed)) * 65) +
    (Math.min(currentWeek.workoutsCount / 3, 1) * 35)
  );
  const projectedGrade = projectedScore >= 85 ? "A" : projectedScore >= 65 ? "B" : "C";
  const pg = gradeConfig(projectedGrade);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

      {/* ── Hero Card (dark) ── */}
      <div className="bg-obsidian rounded-[14px] p-6">
        <div className="sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-[#CDFF00]" />
              <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
            </div>
            <p className="text-white/50 mt-1 text-sm">
              {t("subtitle")}
            </p>
          </div>

          {/* Projected grade */}
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${pg.bg} flex items-center justify-center`}>
              <span className={`text-lg font-bold ${projectedGrade === "B" ? "text-white" : "text-obsidian"}`}>
                {projectedGrade}
              </span>
            </div>
            <div>
              <p className="text-xs text-white/40">{t("projected")}</p>
              <p className="text-sm font-medium text-white">{t("day", { current: currentWeek.daysElapsed })}</p>
            </div>
          </div>
        </div>

        {/* Current week progress bars */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/5">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white">{t("proteinDays")}</span>
              <span className="text-white font-medium">{currentWeek.proteinDaysHit}/{currentWeek.daysElapsed}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#CDFF00] transition-all"
                style={{ width: `${(currentWeek.proteinDaysHit / 7) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white">{t("workouts")}</span>
              <span className="text-white font-medium">{currentWeek.workoutsCount}/3</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#CDFF00] transition-all"
                style={{ width: `${Math.min(1, currentWeek.workoutsCount / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Generate last week's report if missing */}
      {showGenerateButton && (
        <div className="bg-white border border-dashed border-black/10 rounded-[10px] p-5 text-center space-y-3">
          <Sparkles className="h-6 w-6 text-obsidian mx-auto" />
          <p className="text-sm text-mgray">
            {isSunday
              ? t("todayReady")
              : t("lastWeekAvailable", { week: formatWeek(lastWeekStart, lastWeekEnd) })}
          </p>
          <button
            onClick={generateReport}
            disabled={generating}
            className="px-6 py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            {generating ? t("generating") : t("generateReport")}
          </button>
          {error && <p className="text-xs text-[#FFB4AB]">{error}</p>}
        </div>
      )}

      {/* Past reports */}
      {liveReports.length > 0 ? (
        <div className="space-y-4">
          <p className="text-[10px] font-medium text-mgray uppercase tracking-widest">
            {t("pastReports")}
          </p>
          {liveReports.map((report) => (
            <ReportCard key={report.id} report={report} t={t} />
          ))}
        </div>
      ) : (
        !showGenerateButton && (
          <div className="text-center py-16">
            <BarChart2 className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="text-mgray text-sm">{t("noReports")}</p>
            <p className="text-xs text-muted mt-1">
              {t("firstReport")}
            </p>
          </div>
        )
      )}
    </div>
  );
}
