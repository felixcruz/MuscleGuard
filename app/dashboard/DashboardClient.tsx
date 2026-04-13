"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProteinRing } from "@/components/dashboard/ProteinRing";
import { QuickLogForm } from "@/components/dashboard/QuickLogForm";
import { TodayFoodLog } from "@/components/dashboard/TodayFoodLog";
import { Flame, Trophy, Zap, X, ChevronDown, ChevronRight, AlertTriangle, Search, Plus, Sunrise, Sun, Moon, Cookie } from "lucide-react";
import { getDynamicMsg, getSevereAppetiteAlert, type CommStyle } from "@/lib/comm-style";

// ── Meal slot logic ──
const MEAL_ICONS = { breakfast: Sunrise, lunch: Sun, dinner: Moon, snack: Cookie } as const;
const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" } as const;
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface QuickFood {
  name: string;
  protein_g: number;
  calories: number;
  portion_g: number;
}

// Default foods for new users (filtered by dietary prefs at runtime)
const DEFAULT_FOODS: Record<MealType, QuickFood[]> = {
  breakfast: [
    { name: "Greek yogurt (150g)", protein_g: 18, calories: 120, portion_g: 150 },
    { name: "Scrambled eggs (2)", protein_g: 13, calories: 180, portion_g: 120 },
    { name: "Cottage cheese (200g)", protein_g: 22, calories: 180, portion_g: 200 },
    { name: "Protein shake", protein_g: 30, calories: 180, portion_g: 350 },
  ],
  lunch: [
    { name: "Chicken breast (150g)", protein_g: 45, calories: 248, portion_g: 150 },
    { name: "Canned tuna (140g)", protein_g: 30, calories: 110, portion_g: 140 },
    { name: "Ground turkey (150g)", protein_g: 35, calories: 200, portion_g: 150 },
    { name: "Salmon fillet (150g)", protein_g: 39, calories: 312, portion_g: 150 },
  ],
  dinner: [
    { name: "Chicken breast (200g)", protein_g: 60, calories: 330, portion_g: 200 },
    { name: "Lean beef (150g)", protein_g: 38, calories: 270, portion_g: 150 },
    { name: "Salmon (180g)", protein_g: 47, calories: 374, portion_g: 180 },
    { name: "Shrimp (200g)", protein_g: 38, calories: 200, portion_g: 200 },
  ],
  snack: [
    { name: "Protein bar", protein_g: 20, calories: 200, portion_g: 60 },
    { name: "Greek yogurt (100g)", protein_g: 10, calories: 80, portion_g: 100 },
    { name: "Hard-boiled eggs (2)", protein_g: 13, calories: 140, portion_g: 100 },
    { name: "Edamame (150g)", protein_g: 18, calories: 190, portion_g: 150 },
  ],
};

// Non-vegetarian keywords for filtering
const MEAT_KEYWORDS = ["chicken", "beef", "turkey", "tuna", "salmon", "shrimp", "pork", "steak", "lamb"];

function getMealSlot(loggedAt: string): MealType {
  const hour = new Date(loggedAt).getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 17) return "snack";
  return "dinner";
}

interface RecentFoodLog {
  food_name: string;
  protein_g: number;
  calories: number | null;
  portion_g: number | null;
  logged_at: string | null;
}

// All available protein sources for the setup overlay
const PROTEIN_SOURCES = [
  { id: "chicken", label: "Chicken", emoji: "🍗" },
  { id: "eggs", label: "Eggs", emoji: "🥚" },
  { id: "greek_yogurt", label: "Greek yogurt", emoji: "🥛" },
  { id: "cottage_cheese", label: "Cottage cheese", emoji: "🧀" },
  { id: "protein_shake", label: "Protein shake", emoji: "🥤" },
  { id: "tuna", label: "Tuna", emoji: "🐟" },
  { id: "salmon", label: "Salmon", emoji: "🐠" },
  { id: "turkey", label: "Turkey", emoji: "🦃" },
  { id: "beef", label: "Beef", emoji: "🥩" },
  { id: "shrimp", label: "Shrimp", emoji: "🦐" },
  { id: "tofu", label: "Tofu", emoji: "🫘" },
  { id: "edamame", label: "Edamame", emoji: "🌱" },
  { id: "protein_bar", label: "Protein bar", emoji: "🍫" },
  { id: "lentils", label: "Lentils", emoji: "🫘" },
];

const DIETARY_OPTIONS = [
  { value: "none", label: "No restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "dairy_free", label: "Dairy-free" },
];

function buildSmartPresets(
  recentFoods: RecentFoodLog[],
  dietaryPrefs: string[],
  favoriteProteins: string[],
): Record<MealType, QuickFood[]> {
  const isVegetarian = dietaryPrefs.some(p =>
    p.toLowerCase().includes("vegetarian") || p.toLowerCase().includes("vegan")
  );

  // Count frequency per food per slot
  const slotCounts: Record<MealType, Record<string, { count: number; food: QuickFood }>> = {
    breakfast: {}, lunch: {}, dinner: {}, snack: {},
  };

  for (const log of recentFoods) {
    if (!log.logged_at) continue;
    const slot = getMealSlot(log.logged_at);
    const key = log.food_name.toLowerCase();
    if (!slotCounts[slot][key]) {
      slotCounts[slot][key] = {
        count: 0,
        food: {
          name: log.food_name,
          protein_g: Math.round(Number(log.protein_g)),
          calories: Math.round(Number(log.calories ?? 0)),
          portion_g: Math.round(Number(log.portion_g ?? 100)),
        },
      };
    }
    slotCounts[slot][key].count++;
  }

  const result: Record<MealType, QuickFood[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };

  for (const slot of ["breakfast", "lunch", "dinner", "snack"] as MealType[]) {
    // Sort by frequency
    const sorted = Object.values(slotCounts[slot])
      .sort((a, b) => b.count - a.count)
      .map(s => s.food);

    if (sorted.length >= 2) {
      result[slot] = sorted.slice(0, 4);
    } else {
      let defaults = [...DEFAULT_FOODS[slot]];
      if (isVegetarian) {
        defaults = defaults.filter(f =>
          !MEAT_KEYWORDS.some(k => f.name.toLowerCase().includes(k))
        );
      }
      // Prioritize foods matching user's favorite proteins
      if (favoriteProteins.length > 0) {
        defaults.sort((a, b) => {
          const aMatch = favoriteProteins.some(fp => a.name.toLowerCase().includes(fp.replace("_", " ")));
          const bMatch = favoriteProteins.some(fp => b.name.toLowerCase().includes(fp.replace("_", " ")));
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
      }
      const combined = [...sorted, ...defaults.filter(d => !sorted.some(s => s.name === d.name))];
      result[slot] = combined.slice(0, 4);
    }
  }

  return result;
}

function getQuickAddFood(recentFoods: RecentFoodLog[]): QuickFood {
  // Find the user's #1 most logged food overall
  const counts: Record<string, { count: number; food: QuickFood }> = {};
  for (const log of recentFoods) {
    const key = log.food_name.toLowerCase();
    if (!counts[key]) {
      counts[key] = {
        count: 0,
        food: {
          name: log.food_name,
          protein_g: Math.round(Number(log.protein_g)),
          calories: Math.round(Number(log.calories ?? 0)),
          portion_g: Math.round(Number(log.portion_g ?? 100)),
        },
      };
    }
    counts[key].count++;
  }

  const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
  if (sorted.length > 0 && sorted[0].count >= 3) {
    return sorted[0].food;
  }
  // Default for new users
  return { name: "Protein shake", protein_g: 30, calories: 120, portion_g: 40 };
}

// ── Confetti ──
const CONFETTI_COLORS = ["#CDFF00","#131413","#BFC1C0","#FFB4AB","#CDFF00","#585A59","#CDFF00"];
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
  meal_type?: string | null;
}

interface WeekLogEntry {
  id: string;
  food_name: string;
  protein_g: number;
  log_date: string;
  logged_at: string;
  meal_type?: string | null;
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
  recentFoods: RecentFoodLog[];
  dietaryPrefs: string[];
  favoriteProteins: string[] | null;
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
  recentFoods, dietaryPrefs, favoriteProteins,
}: Props) {
  const supabase = createClient();

  const [logs, setLogs] = useState<FoodLogEntry[]>(initialLogs);
  const [streak, setStreak] = useState(proteinStreakDays);
  const [points, setPoints] = useState(totalPoints);
  const [showConfetti, setShowConfetti] = useState(false);
  const goalHitRef = useRef(goalAlreadyHitToday);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [setupDone, setSetupDone] = useState(favoriteProteins !== null);
  const [setupDietary, setSetupDietary] = useState("");
  const [setupFavorites, setSetupFavorites] = useState<string[]>([]);
  const [setupSaving, setSetupSaving] = useState(false);

  const smartPresets = buildSmartPresets(recentFoods, dietaryPrefs, favoriteProteins ?? []);
  const quickAddFood = getQuickAddFood(recentFoods);

  const [activePreset, setActivePreset] = useState<MealType | null>(null);
  const [loggingPreset, setLoggingPreset] = useState<string | null>(null);
  const [quickAdding, setQuickAdding] = useState(false);
  const [weekExpanded, setWeekExpanded] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const [hour, setHour] = useState(12);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setHour(new Date().getHours());
    setMounted(true);
  }, []);

  // Merge today's live logs into weekLogs for accurate This Week totals
  const today = new Date().toISOString().split("T")[0];
  const weekLogsWithoutToday = weekLogs.filter(wl => wl.log_date !== today);
  const todayAsWeekLogs: WeekLogEntry[] = logs.map(l => ({
    id: l.id,
    food_name: l.food_name,
    protein_g: l.protein_g,
    log_date: today,
    logged_at: l.logged_at ?? new Date().toISOString(),
    meal_type: l.meal_type,
  }));
  const mergedWeekLogs = [...weekLogsWithoutToday, ...todayAsWeekLogs];

  const totalProtein = logs.reduce((sum, l) => sum + Number(l.protein_g), 0);
  const pct = proteinGoalG > 0 ? totalProtein / proteinGoalG : 0;
  const remaining = Math.max(0, proteinGoalG - totalProtein);

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
      .select("id, food_name, protein_g, calories, portion_g, logged_at, meal_type")
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

  async function handleSetupSave() {
    setSetupSaving(true);
    const prefs = setupDietary && setupDietary !== "none" ? [setupDietary] : [];
    await supabase
      .from("profiles")
      .update({ dietary_prefs: prefs, favorite_proteins: setupFavorites })
      .eq("id", userId);
    setSetupDone(true);
    setSetupSaving(false);
  }

  async function handleQuickAdd() {
    setQuickAdding(true);
    await supabase.from("food_logs").insert({
      user_id: userId,
      food_name: quickAddFood.name,
      protein_g: quickAddFood.protein_g,
      calories: quickAddFood.calories,
      portion_g: quickAddFood.portion_g,
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

  // Meal breakdown as visual bars
  const maxBreakdown = Math.max(proteinBreakdown.breakfast, proteinBreakdown.lunch, proteinBreakdown.dinner, proteinBreakdown.snack, 1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {showConfetti && <Confetti />}

      {/* ── Severe appetite alert ── */}
      {isSevereAppetite && (() => {
        const alert = getSevereAppetiteAlert(commStyle as CommStyle);
        return (
          <div className="flex items-start gap-3 p-4 bg-obsidian rounded-[10px]">
            <AlertTriangle className="h-5 w-5 text-[#FFB4AB] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-[#FFB4AB] text-sm">{alert.title}</p>
              <p className="text-xs text-white/60 mt-1">{alert.body}</p>
            </div>
          </div>
        );
      })()}

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-obsidian">Today</h1>
          {mounted && <p className="text-sm text-mgray mt-0.5 max-w-xs">{msg.title}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {workoutStreakDays >= 1 && (
            <div className="flex items-center gap-1 bg-white border border-black/5 px-2.5 py-1.5 rounded-full">
              <Flame className="h-3.5 w-3.5 text-obsidian" />
              <span className="text-xs font-semibold text-obsidian">
                {workoutStreakDays} workout{workoutStreakDays !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-white border border-black/5 px-2.5 py-1.5 rounded-full">
            <span className="text-sm">{streak >= 7 ? "🔥🔥" : streak >= 1 ? "🔥" : "💤"}</span>
            <span className={`text-xs font-semibold ${streak >= 1 ? "text-obsidian" : "text-muted"}`}>
              {streak}d protein
            </span>
          </div>
        </div>
      </div>

      {/* Milestone */}
      {milestoneLabel && (
        <div className="flex items-center gap-2 px-3 py-2 bg-obsidian rounded-lg">
          <Trophy className="h-4 w-4 text-[#CDFF00] flex-shrink-0" />
          <span className="text-sm font-medium text-white">{milestoneLabel}</span>
        </div>
      )}

      {/* ── Hero: Protein Card (dark) ── */}
      <div className="bg-obsidian rounded-[14px] overflow-hidden">
        <div className="p-6 sm:flex sm:items-center sm:gap-8">
          {/* Ring */}
          <div className="flex justify-center sm:justify-start sm:shrink-0">
            <ProteinRing goalG={proteinGoalG} loggedG={totalProtein} />
          </div>

          {/* Stats */}
          <div className="mt-5 sm:mt-0 sm:flex-1 space-y-4">
            {/* Sub-message */}
            {mounted && msg.sub && (
              <p className="text-sm text-white/50 sm:text-left text-center">{msg.sub}</p>
            )}

            {/* Meal targets as bars */}
            <div className="grid grid-cols-4 gap-3">
              {(["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => {
                const val = proteinBreakdown[meal];
                const barPct = Math.round((val / maxBreakdown) * 100);
                return (
                  <div key={meal} className="space-y-1.5">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#CDFF00]" style={{ width: `${barPct}%` }} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-white">{val}g</p>
                      <p className="text-[10px] text-white capitalize">{meal}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Training + explanation */}
            <div className="flex items-center gap-3 text-xs">
              {trainingIntensityPct < 95 && (
                <span className="px-2 py-1 rounded bg-white/10 text-white/60">
                  Training: {trainingIntensityPct}%
                </span>
              )}
              <span className="px-2 py-1 rounded bg-white/10 text-white/60">
                {points} pts
              </span>
            </div>
          </div>
        </div>

        {/* Protein explanation */}
        <div className="px-6 py-3 bg-white/5 border-t border-white/5">
          <p className="text-xs text-white leading-relaxed">{proteinGoalExplanation}</p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="space-y-3">

        {!setupDone ? (
          /* First-time food preferences setup */
          <div className="bg-white border border-black/5 rounded-[14px] p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-obsidian">Personalize your quick meals</p>
              <p className="text-xs text-mgray mt-1">Tell us your preferences so we can suggest the right foods for you.</p>
            </div>

            <div>
              <p className="text-xs font-medium text-obsidian mb-2">Dietary preference</p>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSetupDietary(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      setupDietary === opt.value
                        ? "border-obsidian bg-obsidian text-white font-medium"
                        : "border-black/5 bg-white text-mgray hover:border-black/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-obsidian mb-2">Your go-to protein sources</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PROTEIN_SOURCES.map((src) => {
                  const selected = setupFavorites.includes(src.id);
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setSetupFavorites(prev =>
                        selected ? prev.filter(f => f !== src.id) : [...prev, src.id]
                      )}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors ${
                        selected
                          ? "border-obsidian bg-obsidian text-white font-medium"
                          : "border-black/5 bg-white text-mgray hover:border-black/10"
                      }`}
                    >
                      <span>{src.emoji}</span>
                      {src.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSetupSave}
              disabled={setupSaving || setupFavorites.length === 0}
              className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50"
            >
              {setupSaving ? "Saving…" : `Save preferences (${setupFavorites.length} selected)`}
            </button>
          </div>
        ) : (
          /* Meal buttons (after setup) */
          <>
        <div className="flex items-center gap-2">
          <div className="flex-1 grid grid-cols-4 gap-2">
            {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((key) => {
              const Icon = MEAL_ICONS[key];
              const isActive = activePreset === key;
              const hasRecents = recentFoods.length > 0 && smartPresets[key].some(f => !DEFAULT_FOODS[key].some(d => d.name === f.name));
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePreset(isActive ? null : key)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-[10px] border text-xs font-medium transition-colors relative ${
                    isActive
                      ? "border-obsidian bg-obsidian text-white"
                      : "border-black/5 bg-white text-mgray hover:border-black/10"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {MEAL_LABELS[key]}
                  {hasRecents && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#CDFF00]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preset panel */}
        {activePreset && (
          <div className="border border-black/5 rounded-[10px] bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 bg-surface">
              <span className="text-sm font-semibold text-obsidian flex items-center gap-1.5">
                {(() => { const Icon = MEAL_ICONS[activePreset]; return <Icon className="h-4 w-4" />; })()}
                {MEAL_LABELS[activePreset]}
              </span>
              <button onClick={() => setActivePreset(null)} className="text-muted hover:text-obsidian transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-black/5">
              {smartPresets[activePreset].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => logPreset(item)}
                  disabled={loggingPreset === item.name}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-obsidian">{item.name}</p>
                    <p className="text-xs text-mgray">{item.calories} kcal · {item.portion_g}g</p>
                  </div>
                  <span className={`text-sm font-semibold ml-3 flex-shrink-0 ${
                    loggingPreset === item.name ? "text-muted" : "text-green-600"
                  }`}>
                    {loggingPreset === item.name ? "Adding…" : `+${item.protein_g}g`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick add (personalized) */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={quickAdding}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-obsidian text-white text-sm font-medium transition-colors hover:bg-obsidian-light disabled:opacity-60"
        >
          <Zap className="h-4 w-4" />
          {quickAdding ? "Adding…" : `Quick add ${quickAddFood.name} (+${quickAddFood.protein_g}g)`}
        </button>
          </>
        )}
      </div>

      {/* ── Log food (USDA search) ── */}
      <div className="bg-white border border-black/5 rounded-[10px] p-4 space-y-1">
        <h3 className="text-sm font-medium text-obsidian mb-2">Log food</h3>
        <QuickLogForm userId={userId} onLogged={refreshLogs} />
      </div>

      {/* ── Today's log ── */}
      <div className="bg-white border border-black/5 rounded-[10px] p-4">
        <h3 className="text-sm font-medium text-obsidian mb-2">Today&apos;s food</h3>
        <TodayFoodLog entries={logs} onDeleted={refreshLogs} />
      </div>

      {/* ── This Week (collapsible) ── */}
      <ThisWeek
        weekLogs={mergedWeekLogs}
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

// ── This Week ──────────────────────────────────────────────────────────────

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
    <div className="border border-black/5 rounded-[10px] overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted" />
            : <ChevronRight className="h-4 w-4 text-muted" />
          }
          <span className="text-sm font-semibold text-obsidian">This Week</span>
        </div>
        <span className="text-xs text-muted">{weekTotalProtein}g protein total</span>
      </button>

      {expanded && (
        <div className="border-t border-black/5 divide-y divide-black/5">
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
                    entries.length > 0 ? "hover:bg-surface cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {entries.length > 0
                      ? isDayExpanded
                        ? <ChevronDown className="h-3.5 w-3.5 text-muted" />
                        : <ChevronRight className="h-3.5 w-3.5 text-muted" />
                      : <span className="w-3.5" />
                    }
                    <span className={`text-sm ${isToday ? "font-semibold text-obsidian" : "text-mgray"}`}>
                      {isToday ? "Today" : formatDayLabel(date)}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    dayProtein > 0 ? "text-green-600" : "text-muted"
                  }`}>
                    {dayProtein > 0 ? `${dayProtein}g` : "—"}
                  </span>
                </button>

                {isDayExpanded && entries.length > 0 && (
                  <div className="px-4 pb-2 space-y-1.5 bg-surface">
                    {entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between pl-5">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-obsidian line-clamp-1">{entry.food_name}</p>
                          <p className="text-xs text-muted">{formatTime(entry.logged_at)}</p>
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
