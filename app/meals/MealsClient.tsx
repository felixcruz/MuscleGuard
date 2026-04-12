"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Search, Plus } from "lucide-react";
import { MealWizard } from "@/components/meals/MealWizard";

interface USDAFood {
  fdcId: number;
  description: string;
  proteinPer100g: number;
  caloriesPer100g: number;
}

interface Props {
  userId: string;
  proteinGoalG: number;
  proteinLoggedG: number;
  dietaryPrefs: string[];
  proteinBreakdown?: { breakfast: number; lunch: number; dinner: number; snack: number };
}

export function MealsClient({
  userId,
  proteinGoalG,
  proteinLoggedG: initialLogged,
  dietaryPrefs,
  proteinBreakdown,
}: Props) {
  const supabase = createClient();

  const [proteinLogged, setProteinLogged] = useState(initialLogged);
  const proteinRemaining = Math.max(0, proteinGoalG - proteinLogged);
  const pct =
    proteinGoalG > 0
      ? Math.min(100, Math.round((proteinLogged / proteinGoalG) * 100))
      : 0;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<USDAFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<USDAFood | null>(null);
  const [portionG, setPortionG] = useState("100");
  const [logging, setLogging] = useState(false);
  const [loggedFdcId, setLoggedFdcId] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(
          `/api/food/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        setResults(data.foods ?? []);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(food: USDAFood) {
    setSelected(food);
    setResults([]);
    setQuery(food.description);
    setPortionG("100");
    setLoggedFdcId(null);
  }

  function computedNutrients() {
    if (!selected) return { protein: 0, calories: 0 };
    const portion = parseFloat(portionG) || 0;
    return {
      protein: Math.round((selected.proteinPer100g * portion) / 100),
      calories: Math.round((selected.caloriesPer100g * portion) / 100),
    };
  }

  async function handleLogFood() {
    if (!selected) return;
    const portion = parseFloat(portionG);
    if (!portion || portion <= 0) return;
    setLogging(true);
    setSearchError(null);
    const { protein, calories } = computedNutrients();
    try {
      const { error } = await supabase.from("food_logs").insert({
        user_id: userId,
        food_name: selected.description,
        protein_g: protein,
        calories,
        portion_g: portion,
      });
      if (error) throw error;
      setLoggedFdcId(selected.fdcId);
      setProteinLogged((p) => p + protein);
      setQuery("");
      setSelected(null);
      setResults([]);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Failed to log food"
      );
    } finally {
      setLogging(false);
    }
  }

  const nutrients = computedNutrients();
  const maxBreakdown = proteinBreakdown
    ? Math.max(proteinBreakdown.breakfast, proteinBreakdown.lunch, proteinBreakdown.dinner, proteinBreakdown.snack, 1)
    : 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

      {/* ── Hero: Protein Status (dark) ── */}
      <div className="bg-obsidian rounded-[14px] p-6">
        <div className="sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Meals</h1>
            <p className="text-sm text-white/50">
              {proteinRemaining > 0 ? (
                <>
                  <span className="text-[#CDFF00] font-semibold">
                    {proteinRemaining}g protein
                  </span>{" "}
                  remaining today
                </>
              ) : (
                <span className="text-[#CDFF00] font-semibold">
                  Daily protein goal reached!
                </span>
              )}
            </p>
          </div>

          {/* Progress ring (compact) */}
          <div className="mt-4 sm:mt-0 flex items-center gap-4 sm:gap-5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={pct >= 90 ? "#CDFF00" : "#CDFF00"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(pct, 100) / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{pct}%</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-white font-medium">{proteinLogged}g logged</p>
              <p className="text-white/40">{proteinGoalG}g goal</p>
            </div>
          </div>
        </div>

        {/* Meal target bars */}
        {proteinBreakdown && (
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/5">
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
                    <p className="text-[10px] text-white/30 capitalize">{meal}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Food Search ── */}
      <div className="bg-white border border-black/5 rounded-[10px] p-4 space-y-3">
        <h2 className="text-sm font-medium text-obsidian">Log a food</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search USDA database (e.g. chicken breast)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setLoggedFdcId(null);
            }}
            className="w-full pl-9 pr-4 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              Searching…
            </span>
          )}
        </div>

        {results.length > 0 && (
          <div className="border border-black/5 rounded-[10px] overflow-hidden divide-y divide-black/5 bg-white shadow-sm">
            {results.map((food) => (
              <button
                key={food.fdcId}
                type="button"
                onClick={() => handleSelect(food)}
                className="w-full text-left px-4 py-3 hover:bg-surface transition-colors"
              >
                <p className="text-sm font-medium text-obsidian leading-snug">
                  {food.description}
                </p>
                <p className="text-xs text-mgray mt-0.5">
                  {food.proteinPer100g}g protein · {food.caloriesPer100g} kcal
                  per 100g
                </p>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="border border-black/5 rounded-[10px] p-4 bg-surface space-y-3">
            <p className="text-sm font-semibold text-obsidian leading-snug">
              {selected.description}
            </p>
            <p className="text-xs text-mgray">
              {selected.proteinPer100g}g protein · {selected.caloriesPer100g}{" "}
              kcal per 100g
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm text-mgray whitespace-nowrap">
                  Portion
                </label>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={portionG}
                  onChange={(e) => setPortionG(e.target.value)}
                  className="w-20 px-2 py-1.5 border border-black/10 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
                />
                <span className="text-sm text-mgray">g</span>
              </div>
              <div className="text-right text-sm text-obsidian">
                <span className="font-semibold text-green-600">
                  {nutrients.protein}g
                </span>{" "}
                protein
                {" · "}
                {nutrients.calories} kcal
              </div>
            </div>
            <button
              onClick={handleLogFood}
              disabled={logging || !portionG || parseFloat(portionG) <= 0}
              className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {logging ? "Logging…" : "Log food"}
            </button>
          </div>
        )}

        {loggedFdcId && (
          <div className="flex items-center gap-2 p-3 bg-obsidian rounded-lg text-sm">
            <div className="w-5 h-5 rounded-full bg-[#CDFF00] flex items-center justify-center">
              <Check className="h-3 w-3 text-obsidian" />
            </div>
            <span className="text-white font-medium">Logged successfully!</span>
          </div>
        )}

        {searchError && (
          <div className="p-3 bg-alert/10 border border-alert/20 rounded-lg text-obsidian text-sm">
            {searchError}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-black/5" />
        <span className="text-xs text-muted uppercase tracking-widest font-medium">
          or get meal ideas
        </span>
        <div className="h-px flex-1 bg-black/5" />
      </div>

      {/* ── Meal Wizard ── */}
      <MealWizard
        userId={userId}
        proteinRemainingG={proteinRemaining}
        dietaryPrefs={dietaryPrefs}
        onMealLogged={(proteinG) => setProteinLogged((p) => p + proteinG)}
      />
    </div>
  );
}
