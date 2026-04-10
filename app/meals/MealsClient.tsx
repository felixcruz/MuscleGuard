"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MealCard, type Meal } from "@/components/meals/MealCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, Plus, Check } from "lucide-react";

interface USDAFood {
  fdcId: number;
  description: string;
  proteinPer100g: number;
  caloriesPer100g: number;
}

interface Props {
  userId: string;
  proteinRemainingG: number;
  dietaryPrefs: string[];
}

export function MealsClient({ userId, proteinRemainingG, dietaryPrefs }: Props) {
  const supabase = createClient();

  // ── AI meal ideas ──
  const [meals, setMeals] = useState<Meal[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Food search ──
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<USDAFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<USDAFood | null>(null);
  const [portionG, setPortionG] = useState("100");
  const [logging, setLogging] = useState(false);
  const [loggedFdcId, setLoggedFdcId] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
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
      setQuery("");
      setSelected(null);
      setResults([]);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to log food");
    } finally {
      setLogging(false);
    }
  }

  // ── AI meal ideas ──
  async function handleGenerate() {
    setGenerating(true);
    setMeals([]);
    setAiError(null);
    try {
      const res = await fetch("/api/generate-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proteinRemainingG, dietaryPrefs }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `API error: ${res.status}`);
      }
      const data = await res.json();
      setMeals(data.meals ?? []);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate meals");
    } finally {
      setGenerating(false);
    }
  }

  async function handleLogMeal(meal: Meal) {
    setLoggingId(meal.name);
    try {
      const { error: dbError } = await supabase.from("food_logs").insert({
        user_id: userId,
        food_name: meal.name,
        protein_g: meal.protein_g,
        calories: meal.calories,
        portion_g: meal.portion_g,
      });
      if (dbError) throw dbError;
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to log meal");
    } finally {
      setLoggingId(null);
    }
  }

  const nutrients = computedNutrients();

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
        <p className="text-gray-500 mt-1">
          You need{" "}
          <span className="text-brand-700 font-semibold">{proteinRemainingG}g more protein</span>{" "}
          today.
        </p>
      </div>

      {/* ── Food Search ── */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Log a food</h2>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search USDA database (e.g. chicken breast)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setLoggedFdcId(null);
            }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching…</span>
          )}
        </div>

        {/* Results dropdown */}
        {results.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 bg-white shadow-sm">
            {results.map((food) => (
              <button
                key={food.fdcId}
                type="button"
                onClick={() => handleSelect(food)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900 leading-snug">{food.description}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {food.proteinPer100g}g protein · {food.caloriesPer100g} kcal per 100g
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Selected food — portion + log */}
        {selected && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
            <p className="text-sm font-semibold text-gray-900 leading-snug">{selected.description}</p>
            <p className="text-xs text-gray-500">
              {selected.proteinPer100g}g protein · {selected.caloriesPer100g} kcal per 100g
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm text-gray-600 whitespace-nowrap">Portion</label>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={portionG}
                  onChange={(e) => setPortionG(e.target.value)}
                  className="w-20 px-2 py-1.5 border border-gray-200 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
                <span className="text-sm text-gray-500">g</span>
              </div>
              <div className="text-right text-sm text-gray-700">
                <span className="font-semibold text-brand-700">{nutrients.protein}g</span> protein
                {" · "}
                {nutrients.calories} kcal
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleLogFood}
              disabled={logging || !portionG || parseFloat(portionG) <= 0}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              {logging ? "Logging…" : "Log food"}
            </Button>
          </div>
        )}

        {/* Logged confirmation */}
        {loggedFdcId && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <Check className="h-4 w-4 flex-shrink-0" />
            Logged successfully!
          </div>
        )}

        {searchError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {searchError}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400 uppercase tracking-wide">or get AI meal ideas</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* ── AI Meal Ideas ── */}
      <div className="space-y-4">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full"
          size="lg"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {generating ? "Generating your meals…" : "Generate today's meal ideas"}
        </Button>

        {aiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {aiError}
          </div>
        )}

        {generating && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {meals.length > 0 && (
          <div className="space-y-4">
            {meals.map((meal, index) => (
              <MealCard
                key={`${index}-${meal.name}`}
                meal={meal}
                onLog={handleLogMeal}
                logging={loggingId === meal.name}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
