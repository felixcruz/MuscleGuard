"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProteinRing } from "@/components/dashboard/ProteinRing";
import { QuickLogForm } from "@/components/dashboard/QuickLogForm";
import { TodayFoodLog } from "@/components/dashboard/TodayFoodLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Zap, X, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { getDynamicMsg, getSevereAppetiteAlert, type CommStyle } from "@/lib/comm-style";

// ── Meal presets ──
const MEAL_PRESETS = {
  breakfast: {
    emoji: "🌅", label: "Breakfast",
    items: [
      { name: "Greek yogurt (150g)", protein_g: 18, calories: 120, portion_g: 150 },
      { name: "Scrambled eggs (2)", protein_g: 13, calories: 180, portion_g: 120 },
      { name: "Cottage cheese (200g)", protein_g: 22, calories: 180, portion_g: 200 },
      { name: "Protein shake", protein_g: 30, calories: 180, portion_g: 350 },
    ],
  },
  lunch: {
    emoji: "☀️", label: "Lunch",
    items: [
      { name: "Chicken breast (150g)", protein_g: 45, calories: 248, portion_g: 150 },
      { name: "Canned tuna (140g)", protein_g: 30, calories: 110, portion_g: 140 },
      { name: "Ground turkey (150g)", protein_g: 35, calories: 200, portion_g: 150 },
      { name: "Salmon fillet (150g)", protein_g: 39, calories: 312, portion_g: 150 },
    ],
  },
  dinner: {
    emoji: "🌙", label: "Dinner",
    items: [
      { name: "Chicken breast (200g)", protein_g: 60, calories: 330, portion_g: 200 },
      { name: "Lean beef (150g)", protein_g: 38, calories: 270, portion_g: 150 },
      { name: "Salmon (180g)", protein_g: 47, calories: 374, portion_g: 180 },
      { name: "Shrimp (200g)", protein_g: 38, calories: 200, portion_g: 200 },
    ],
  },
  snack: {
    emoji: "⚡", label: "Snack",
    items: [
      { name: "Protein bar", protein_g: 20, calories: 200, portion_g: 60 },
      { name: "Greek yogurt (100g)", protein_g: 10, calories: 80, portion_g: 100 },
      { name: "Hard-boiled eggs (2)", protein_g: 13, calories: 140, portion_g: 100 },
      { name: "Edamame (150g)", protein_g: 18, calories: 190, portion_g: 150 },
    ],
  },
} as const;

type MealType = keyof typeof MEAL_PRESETS;

// ── Confetti ──
const CONFETTI_COLORS = ["#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#ff922b","#cc5de8","#20c997"];
const CONFETTI_PIECES = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: (i / 32) * 100,
  delay: (i % 8) * 0.1,
  dur: 1.5 + (i % 4) * 0.2,
  size: 7 + (i % 3) * 3,
  round: i % 3 === 0,
}));

function Confetti() {
  return (
    <>
      <style>{`
        @keyframes mg-confetti {
          0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh)  rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden" }}>
        {CONFETTI_PIECES.map(p => (
          <div key={p.id} style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? "50%" : "2px",
            animation: `mg-confetti ${p.dur}s ${p.delay}s ease-in forwards`,
          }} />
        ))}
      </div>
    </>
  );
}


// ── Types ──
interface FoodLogEntry {
  id: string;
  food_name: string;
  protein_g: number;
  calories: number | null;
  portion_g: number | null;
  logged_at?: string | null;
}

interface WeekLogEntry {
  id: string;
  food_name: string;
  protein_g: number;
  log_date: string;
  logged_at: string;
}

interface Props {
  userId: string;
  proteinGoalG: number;
  initialLogs: FoodLogEntry[];
  weekLogs: WeekLogEntry[];
  weekStart: string;
  proteinStreakDays: number;
  workoutStreakDays: number;
  totalPoints: number;
  goalAlreadyHitToday: boolean;
  proteinGoalExplanation: string;
  proteinBreakdown: { breakfast: number; lunch: number; dinner: number; snack: number };
  trainingIntensityPct: number;
  appetiteLevel: string;
  commStyle: string;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDayLabel(dateStr: string) {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function DashboardClient({
  userId, proteinGoalG, initialLogs, weekLogs, weekStart,
  proteinStreakDays, workoutStreakDays, totalPoints,
  goalAlreadyHitToday, proteinGoalExplanation, proteinBreakdown,
  trainingIntensityPct, appetiteLevel, commStyle,
}: Props) {
  const supabase = createClient();

  const [logs, setLogs] = useState<FoodLogEntry[]>(initialLogs);
  const [streak, setStreak] = useState(proteinStreakDays);
  const [points, setPoints] = useState(totalPoints);
  const [showConfetti, setShowConfetti] = useState(false);
  const goalHitRef = useRef(goalAlreadyHitToday);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activePreset, setActivePreset] = useState<MealType | null>(null);
  const [loggingPreset, setLoggingPreset] = useState<string | null>(null);
  const [quickAdding, setQuickAdding] = useState(false);
  const [weekExpanded, setWeekExpanded] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Avoid SSR/client mismatch for time-based message
  const [hour, setHour] = useState(12);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setHour(new Date().getHours());
    setMounted(true);
  }, []);

  const totalProtein = logs.reduce((sum, l) => sum + Number(l.protein_g), 0);
  const pct = proteinGoalG > 0 ? totalProtein / proteinGoalG : 0;
  const remaining = Math.max(0, proteinGoalG - totalProtein);

  // Confetti + streak when goal first reached this session
  useEffect(() => {
    if (pct >= 0.9 && !goalHitRef.current) {
      goalHitRef.current = true;
      setShowConfetti(true);
      confettiTimer.current = setTimeout(() => setShowConfetti(false), 3000);
      fetch("/api/streak/protein", { method: "POST" })
        .then(r => r.json())
        .then(d => {
          if (typeof d.streak === "number") setStreak(d.streak);
          if (typeof d.points === "number") setPoints(d.points);
        });
    }
  }, [pct]);

  useEffect(() => {
    return () => { if (confettiTimer.current) clearTimeout(confettiTimer.current); };
  }, []);

  const refreshLogs = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("food_logs")
      .select("id, food_name, protein_g, calories, portion_g, logged_at")
      .eq("user_id", userId)
      .eq("log_date", today)
      .order("logged_at", { ascending: true });
    setLogs(data ?? []);
  }, [supabase, userId]);

  async function logPreset(item: { name: string; protein_g: number; calories: number; portion_g: number }) {
    setLoggingPreset(item.name);
    await supabase.from("food_logs").insert({
      user_id: userId,
      food_name: item.name,
      protein_g: item.protein_g,
      calories: item.calories,
      portion_g: item.portion_g,
    });
    await refreshLogs();
    setLoggingPreset(null);
    setActivePreset(null);
  }

  async function quickAdd30g() {
    setQuickAdding(true);
    await supabase.from("food_logs").insert({
      user_id: userId,
      food_name: "Protein supplement (30g)",
      protein_g: 30,
      calories: 120,
      portion_g: 40,
    });
    await refreshLogs();
    setQuickAdding(false);
  }

  const msg = mounted ? getDynamicMsg(hour, pct, remaining, commStyle as CommStyle) : { title: "Today", sub: "" };
  const milestoneLabel =
    streak >= 30 ? "🏆 30-day protein streak!" :
    streak >= 14 ? "⭐ 14-day protein streak!" :
    streak >= 7  ? "🎖 7-day protein streak!"  : null;

  const isSevereAppetite = appetiteLevel === "severe" || appetiteLevel === "very_severe";

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
      {showConfetti && <Confetti />}

      {/* ── Severe appetite alert banner ── */}
      {isSevereAppetite && (() => {
        const alert = getSevereAppetiteAlert(commStyle as CommStyle);
        return (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">{alert.title}</p>
              <p className="text-xs text-amber-700 mt-1">{alert.body}</p>
            </div>
          </div>
        );
      })()}

      {/* ── Header: streak badges ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today</h1>
          {mounted && <p className="text-sm text-gray-500 mt-0.5 max-w-xs">{msg.title}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {workoutStreakDays >= 1 && (
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-full">
              <Flame className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-blue-700">
                {workoutStreakDays} workout{workoutStreakDays !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border ${
            streak >= 1 ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-200"
          }`}>
            <span className="text-sm">{streak >= 7 ? "🔥🔥" : streak >= 1 ? "🔥" : "💤"}</span>
            <span className={`text-xs font-semibold ${streak >= 1 ? "text-orange-700" : "text-gray-400"}`}>
              {streak}d protein
            </span>
          </div>
        </div>
      </div>

      {/* Milestone badge */}
      {milestoneLabel && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Trophy className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <span className="text-sm font-medium text-yellow-800">{milestoneLabel}</span>
        </div>
      )}

      {/* ── Protein ring ── */}
      <Card>
        <CardContent className="pt-8 pb-4 flex justify-center">
          <ProteinRing goalG={proteinGoalG} loggedG={totalProtein} />
        </CardContent>
        {/* Protein personalization info */}
        <div className="px-5 pb-5 space-y-2 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 leading-relaxed">{proteinGoalExplanation}</p>
          <p className="text-xs text-gray-400">
            <span className="font-medium text-gray-600">Meal targets:</span>{" "}
            Breakfast: {proteinBreakdown.breakfast}g · Lunch: {proteinBreakdown.lunch}g · Dinner: {proteinBreakdown.dinner}g · Snack: {proteinBreakdown.snack}g
          </p>
          {trainingIntensityPct < 95 && (
            <p className="text-xs text-gray-400">
              <span className="font-medium text-gray-600">Training today:</span>{" "}
              {trainingIntensityPct}% intensity
            </p>
          )}
        </div>
      </Card>

      {/* Sub-message */}
      {mounted && msg.sub && (
        <p className="text-sm text-gray-500 text-center -mt-2">{msg.sub}</p>
      )}

      {/* Points */}
      <div className="flex items-center justify-center gap-1.5">
        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
        <span className="text-xs text-gray-400 font-medium">{points} points</span>
        <span className="text-gray-200">·</span>
        <span className="text-xs text-gray-400">Protein goal = +10pts · Workout = +5pts</span>
      </div>

      {/* ── Quick-add meal buttons ── */}
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(MEAL_PRESETS) as MealType[]).map((key) => {
            const preset = MEAL_PRESETS[key];
            const isActive = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActivePreset(isActive ? null : key)}
                className="flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-lg border text-xs font-medium transition-colors"
                style={isActive
                  ? { borderColor: "#2e7d32", background: "#f1f8f1", color: "#1b5e20" }
                  : { borderColor: "#e5e7eb", background: "#fff", color: "#4b5563" }
                }
              >
                <span className="text-lg">{preset.emoji}</span>
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Preset panel */}
        {activePreset && (
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-semibold text-gray-800">
                {MEAL_PRESETS[activePreset].emoji} {MEAL_PRESETS[activePreset].label}
              </span>
              <button onClick={() => setActivePreset(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {MEAL_PRESETS[activePreset].items.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => logPreset(item)}
                  disabled={loggingPreset === item.name}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.calories} kcal</p>
                  </div>
                  <span className="text-sm font-semibold ml-3 flex-shrink-0" style={{
                    color: loggingPreset === item.name ? "#9ca3af" : "#15803d"
                  }}>
                    {loggingPreset === item.name ? "Adding…" : `+${item.protein_g}g`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick add 30g */}
        <button
          type="button"
          onClick={quickAdd30g}
          disabled={quickAdding}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed text-sm font-medium transition-colors disabled:opacity-60"
          style={{ borderColor: "#86efac", background: "#f0fdf4", color: "#15803d" }}
        >
          <Zap className="h-4 w-4" />
          {quickAdding ? "Adding…" : "Quick add 30g protein"}
        </button>
      </div>

      {/* ── Log food (USDA search) ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Log food</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickLogForm userId={userId} onLogged={refreshLogs} />
        </CardContent>
      </Card>

      {/* ── Today's log ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today&apos;s food</CardTitle>
        </CardHeader>
        <CardContent>
          <TodayFoodLog entries={logs} onDeleted={refreshLogs} />
        </CardContent>
      </Card>

      {/* ── This Week (collapsible) ── */}
      <ThisWeek
        weekLogs={weekLogs}
        weekStart={weekStart}
        expanded={weekExpanded}
        onToggle={() => setWeekExpanded(e => !e)}
        expandedDays={expandedDays}
        onToggleDay={(d) =>
          setExpandedDays(prev => {
            const next = new Set(prev);
            next.has(d) ? next.delete(d) : next.add(d);
            return next;
          })
        }
      />
    </div>
  );
}

// ── This Week sub-component ──────────────────────────────────────────────────

interface ThisWeekProps {
  weekLogs: WeekLogEntry[];
  weekStart: string;
  expanded: boolean;
  onToggle: () => void;
  expandedDays: Set<string>;
  onToggleDay: (date: string) => void;
}

function ThisWeek({ weekLogs, weekStart, expanded, onToggle, expandedDays, onToggleDay }: ThisWeekProps) {
  const today = new Date().toISOString().split("T")[0];
  const days: string[] = [];
  const cursor = new Date(weekStart + "T12:00:00Z");
  const end = new Date(today + "T12:00:00Z");
  while (cursor <= end) {
    days.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  const byDay: Record<string, WeekLogEntry[]> = {};
  for (const log of weekLogs) {
    if (!byDay[log.log_date]) byDay[log.log_date] = [];
    byDay[log.log_date].push(log);
  }

  const weekTotalProtein = weekLogs.reduce((s, l) => s + Number(l.protein_g), 0);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-gray-400" />
            : <ChevronRight className="h-4 w-4 text-gray-400" />
          }
          <span className="text-sm font-semibold text-gray-700">This Week</span>
        </div>
        <span className="text-xs text-gray-400">{weekTotalProtein}g protein total</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {[...days].reverse().map((date) => {
            const entries = byDay[date] ?? [];
            const dayProtein = entries.reduce((s, l) => s + Number(l.protein_g), 0);
            const isToday = date === today;
            const isDayExpanded = expandedDays.has(date);

            return (
              <div key={date}>
                <button
                  type="button"
                  onClick={() => entries.length > 0 && onToggleDay(date)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                    entries.length > 0 ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {entries.length > 0
                      ? isDayExpanded
                        ? <ChevronDown className="h-3.5 w-3.5 text-gray-300" />
                        : <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                      : <span className="w-3.5" />
                    }
                    <span className={`text-sm ${isToday ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                      {isToday ? "Today" : formatDayLabel(date)}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    dayProtein > 0 ? "text-green-600" : "text-gray-300"
                  }`}>
                    {dayProtein > 0 ? `${dayProtein}g` : "—"}
                  </span>
                </button>

                {isDayExpanded && entries.length > 0 && (
                  <div className="px-4 pb-2 space-y-1.5 bg-gray-50">
                    {entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between pl-5">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-700 line-clamp-1">{entry.food_name}</p>
                          <p className="text-xs text-gray-400">{formatTime(entry.logged_at)}</p>
                        </div>
                        <span className="text-xs font-semibold text-green-600 ml-2 flex-shrink-0">
                          +{entry.protein_g}g
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
