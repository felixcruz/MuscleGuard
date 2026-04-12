"use client";

import { useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const GRADE_STYLES = {
  A: { bg: "bg-[#CDFF00]", text: "text-obsidian", light: "bg-[#CDFF00]/10 border-[#CDFF00]/20" },
  B: { bg: "bg-surface", text: "text-obsidian", light: "bg-surface border-black/5" },
  C: { bg: "bg-alert", text: "text-obsidian", light: "bg-alert/10 border-alert/20" },
};

function formatWeek(weekStart: string, weekEnd: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = new Date(weekStart + "T12:00:00Z").toLocaleDateString("en-US", opts);
  const e = new Date(weekEnd + "T12:00:00Z").toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  });
  return `${s} – ${e}`;
}

function GradeBadge({ grade }: { grade: "A" | "B" | "C" }) {
  const style = GRADE_STYLES[grade];
  return (
    <div
      className={`w-14 h-14 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}
    >
      <span className="text-2xl font-bold text-obsidian">{grade}</span>
    </div>
  );
}

function ReportCard({ report }: { report: WeeklyReportData }) {
  const [expanded, setExpanded] = useState(false);
  const style = GRADE_STYLES[report.grade as "A" | "B" | "C"];

  return (
    <div className={`border rounded-[10px] p-4 space-y-3 ${style.light}`}>
      <div className="flex items-start gap-4">
        <GradeBadge grade={report.grade as "A" | "B" | "C"} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-mgray font-medium">
            {formatWeek(report.week_start, report.week_end)}
          </p>
          <div className="flex gap-4 mt-1.5 text-sm text-obsidian">
            <span>
              🥩 <strong>{report.protein_days_hit}</strong>/7 protein days
            </span>
            <span>
              🏋️ <strong>{report.workouts_count}</strong> workout{report.workouts_count !== 1 ? "s" : ""}
            </span>
          </div>
          {/* Score bar */}
          <div className="mt-2">
            <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-obsidian"
                style={{ width: `${Math.min(100, report.score)}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-0.5">Score: {Math.round(report.score)}/100</p>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div>
        <p
          className={`text-sm text-obsidian leading-relaxed ${
            !expanded ? "line-clamp-2" : ""
          }`}
        >
          {report.summary_text}
        </p>
        {report.summary_text.length > 120 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-muted hover:text-obsidian mt-0.5"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
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

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-obsidian">Weekly Reports</h1>
          <p className="text-mgray text-sm mt-1">
            Auto-generated every Sunday · A / B / C grade
          </p>
        </div>
        <TrendingUp className="h-6 w-6 text-muted mt-1" />
      </div>

      {/* Current week preview */}
      <div className="border border-black/5 rounded-[10px] p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-obsidian">This week so far</p>
          <span className="text-xs text-muted">
            Day {currentWeek.daysElapsed}/7
          </span>
        </div>

        <div className="space-y-2">
          {/* Protein days */}
          <div>
            <div className="flex justify-between text-xs text-mgray mb-1">
              <span>Protein days</span>
              <span>
                {currentWeek.proteinDaysHit}/{currentWeek.daysElapsed} days
              </span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${(currentWeek.proteinDaysHit / 7) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Workouts */}
          <div>
            <div className="flex justify-between text-xs text-mgray mb-1">
              <span>Workouts</span>
              <span>{currentWeek.workoutsCount}/3 target</span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${Math.min(1, currentWeek.workoutsCount / 3) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-muted">
          Report will be generated automatically this Sunday.
        </p>
      </div>

      {/* Generate last week's report if missing */}
      {showGenerateButton && (
        <div className="border border-dashed border-black/10 rounded-[10px] p-4 text-center space-y-2">
          <p className="text-sm text-mgray">
            {isSunday
              ? "Today's report is ready to generate!"
              : `Last week's report (${formatWeek(lastWeekStart, lastWeekEnd)}) hasn't been generated yet.`}
          </p>
          <Button onClick={generateReport} disabled={generating} size="sm" className="bg-obsidian text-white hover:bg-obsidian-light">
            <Sparkles className="h-4 w-4 mr-1.5" />
            {generating ? "Generating…" : "Generate report"}
          </Button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}

      {/* Past reports */}
      {liveReports.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-obsidian uppercase tracking-wide">
            Past reports
          </h2>
          {liveReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      ) : (
        !showGenerateButton && (
          <div className="text-center py-10 text-muted">
            <p className="text-sm">No reports yet.</p>
            <p className="text-xs mt-1">
              Your first report will appear after the first Sunday.
            </p>
          </div>
        )
      )}
    </div>
  );
}
