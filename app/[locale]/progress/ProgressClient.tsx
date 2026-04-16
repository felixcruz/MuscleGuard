"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { MeasurementForm } from "@/components/progress/MeasurementForm";
import { AlertTriangle, TrendingDown, TrendingUp, Scale, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface Measurement {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  muscle_mass_kg: number | null;
  body_fat_pct: number | null;
}

interface MedicationLog {
  id: string;
  dose_mg: number;
  change_date: string;
  change_type: string;
  created_at: string;
}

interface Props {
  userId: string;
  initialMeasurements: Measurement[];
  medicationLogs?: MedicationLog[];
}

function checkMuscleLoss(measurements: Measurement[]): boolean {
  if (measurements.length < 2) return false;
  const recent = measurements[measurements.length - 1];
  const weekAgo = measurements.find(
    (m) =>
      new Date(recent.measured_at).getTime() -
        new Date(m.measured_at).getTime() >=
      6 * 24 * 60 * 60 * 1000
  );
  if (!weekAgo || !recent.muscle_mass_kg || !weekAgo.muscle_mass_kg)
    return false;
  return weekAgo.muscle_mass_kg - recent.muscle_mass_kg > 1;
}

export function ProgressClient({
  userId,
  initialMeasurements,
  medicationLogs = [],
}: Props) {
  const t = useTranslations("progress");
  const tc = useTranslations("common");
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("body_measurements")
      .select("id, measured_at, weight_kg, muscle_mass_kg, body_fat_pct")
      .eq("user_id", userId)
      .order("measured_at", { ascending: true })
      .limit(60);
    setMeasurements(data ?? []);
  }, [supabase, userId]);

  async function handleDelete(id: string) {
    await supabase.from("body_measurements").delete().eq("id", id);
    await refresh();
  }

  const muscleLossAlert = checkMuscleLoss(measurements);

  const chartData = measurements.map((m) => ({
    date: new Date(m.measured_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    dateIso: m.measured_at.split("T")[0],
    weight: m.weight_kg,
    muscle: m.muscle_mass_kg,
    fat: m.body_fat_pct,
  }));

  const doseDates = medicationLogs.map((log) => ({
    date: new Date(log.change_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    dose: log.dose_mg,
    type: log.change_type,
  }));

  // Summary stats
  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const first = measurements.length > 1 ? measurements[0] : null;
  const weightChange = latest?.weight_kg && first?.weight_kg
    ? (latest.weight_kg - first.weight_kg).toFixed(1)
    : null;
  const muscleChange = latest?.muscle_mass_kg && first?.muscle_mass_kg
    ? (latest.muscle_mass_kg - first.muscle_mass_kg).toFixed(1)
    : null;

  const hasCharts = chartData.length >= 2;
  const hasMuscleData = chartData.some((d) => d.muscle !== null);
  const hasFatData = chartData.some((d) => d.fat !== null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

      {/* ── Hero Card (dark) ── */}
      <div className="bg-obsidian rounded-[14px] p-6">
        <div className="sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
            <p className="text-white/50 mt-1 text-sm">
              {t("subtitle")}
            </p>
          </div>

          {/* Summary stats */}
          {latest && (
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              {latest.weight_kg && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{latest.weight_kg}</p>
                  <p className="text-[10px] text-white uppercase">kg</p>
                </div>
              )}
              {latest.muscle_mass_kg && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#CDFF00]">{latest.muscle_mass_kg}</p>
                  <p className="text-[10px] text-white uppercase">{t("kgMuscle")}</p>
                </div>
              )}
              {latest.body_fat_pct && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{latest.body_fat_pct}%</p>
                  <p className="text-[10px] text-white uppercase">{t("bodyFat")}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Change indicators */}
        {(weightChange || muscleChange) && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
            {weightChange && (
              <div className="flex items-center gap-1.5 text-sm">
                {parseFloat(weightChange) <= 0
                  ? <TrendingDown className="h-4 w-4 text-[#CDFF00]" />
                  : <TrendingUp className="h-4 w-4 text-[#FFB4AB]" />
                }
                <span className="text-white font-medium">{weightChange} kg</span>
                <span className="text-white/40">{t("weight").toLowerCase()}</span>
              </div>
            )}
            {muscleChange && (
              <div className="flex items-center gap-1.5 text-sm">
                {parseFloat(muscleChange) >= 0
                  ? <TrendingUp className="h-4 w-4 text-[#CDFF00]" />
                  : <TrendingDown className="h-4 w-4 text-[#FFB4AB]" />
                }
                <span className="text-white font-medium">{muscleChange} kg</span>
                <span className="text-white/40">{t("muscle").toLowerCase()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Muscle loss alert */}
      {muscleLossAlert && (
        <div className="flex items-start gap-3 p-4 bg-obsidian rounded-[10px]">
          <AlertTriangle className="h-5 w-5 text-[#FFB4AB] mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-[#FFB4AB] text-sm">{t("muscleLossDetected")}</p>
            <p className="text-xs text-white mt-0.5">
              {t("muscleLossDesc")}{" "}
              <a href="/meals" className="underline text-[#CDFF00]">
                {t("mealPlan")}
              </a>{" "}
              {t("and")}{" "}
              <a href="/training" className="underline text-[#CDFF00]">
                {t("strengthTraining")}
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* ── Log Measurement ── */}
      <div className="bg-white border border-black/5 rounded-[10px] p-5 space-y-1">
        <h3 className="text-sm font-medium text-obsidian mb-3">{t("logMeasurement")}</h3>
        <MeasurementForm userId={userId} onSaved={refresh} />
      </div>

      {/* ── Charts ── */}
      {hasCharts && (
        <div className={`grid gap-4 ${hasMuscleData || hasFatData ? "sm:grid-cols-2" : ""}`}>
          {/* Weight chart */}
          <div className="bg-white border border-black/5 rounded-[10px] p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-obsidian">{t("weightTrend")}</h3>
              <Scale className="h-4 w-4 text-muted" />
            </div>
            {doseDates.length > 0 && (
              <p className="text-[10px] text-muted uppercase tracking-widest mb-3">
                {t("doseChanges")}
              </p>
            )}
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#BFC1C0" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#BFC1C0" }} domain={["auto", "auto"]} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#131413", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
                  labelStyle={{ color: "#BFC1C0" }}
                />
                {doseDates.map((dd, i) => (
                  <ReferenceLine
                    key={i}
                    x={dd.date}
                    stroke="#CDFF00"
                    strokeDasharray="3 3"
                    strokeOpacity={0.6}
                    label={{
                      value: `${dd.dose}mg`,
                      position: "top",
                      fontSize: 9,
                      fill: "#CDFF00",
                    }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="#131413"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#131413" }}
                  activeDot={{ r: 5, fill: "#CDFF00" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Muscle chart */}
          {hasMuscleData && (
            <div className="bg-white border border-black/5 rounded-[10px] p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-obsidian">{t("muscleMassTrend")}</h3>
                <TrendingUp className="h-4 w-4 text-muted" />
              </div>
              {doseDates.length > 0 && (
                <p className="text-[10px] text-muted uppercase tracking-widest mb-3">
                  {t("doseChanges")}
                </p>
              )}
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#BFC1C0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#BFC1C0" }} domain={["auto", "auto"]} axisLine={false} tickLine={false} width={35} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#131413", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
                    labelStyle={{ color: "#BFC1C0" }}
                  />
                  {doseDates.map((dd, i) => (
                    <ReferenceLine
                      key={i}
                      x={dd.date}
                      stroke="#CDFF00"
                      strokeDasharray="3 3"
                      strokeOpacity={0.6}
                      label={{
                        value: `${dd.dose}mg`,
                        position: "top",
                        fontSize: 9,
                        fill: "#CDFF00",
                      }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="muscle"
                    name="Muscle mass (kg)"
                    stroke="#CDFF00"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#CDFF00" }}
                    activeDot={{ r: 5, fill: "#CDFF00" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Body fat chart */}
          {hasFatData && (
            <div className={`bg-white border border-black/5 rounded-[10px] p-5 ${hasMuscleData ? "sm:col-span-2" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-obsidian">{t("bodyFatTrend")}</h3>
                <TrendingDown className="h-4 w-4 text-muted" />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#BFC1C0" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#BFC1C0" }} domain={["auto", "auto"]} axisLine={false} tickLine={false} width={35} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#131413", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
                    labelStyle={{ color: "#BFC1C0" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fat"
                    name="Body fat (%)"
                    stroke="#585A59"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#585A59" }}
                    activeDot={{ r: 5, fill: "#CDFF00" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Recent measurements history */}
      {measurements.length > 0 && (
        <div className="bg-white border border-black/5 rounded-[10px] overflow-hidden">
          <button
            type="button"
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors"
          >
            <span className="text-sm font-medium text-obsidian">{t("recentMeasurements")}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-mgray">{measurements.length} {tc("entries")}</span>
              {historyExpanded
                ? <ChevronDown className="h-4 w-4 text-muted" />
                : <ChevronRight className="h-4 w-4 text-muted" />
              }
            </div>
          </button>
          {historyExpanded && (
            <div className="border-t border-black/5 divide-y divide-black/5">
              {[...measurements].reverse().slice(0, 10).map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-mgray w-20">
                      {new Date(m.measured_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      {m.weight_kg && (
                        <span className="text-obsidian font-medium">{m.weight_kg} kg</span>
                      )}
                      {m.muscle_mass_kg && (
                        <span className="text-mgray">{m.muscle_mass_kg} {t("kgMuscle")}</span>
                      )}
                      {m.body_fat_pct && (
                        <span className="text-mgray">{m.body_fat_pct}% {t("fat")}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-muted hover:text-[#FFB4AB] transition-colors p-1"
                    aria-label="Delete measurement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {measurements.length === 0 && (
        <div className="text-center py-12">
          <Scale className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-mgray text-sm">{t("logFirst")}</p>
        </div>
      )}
    </div>
  );
}
