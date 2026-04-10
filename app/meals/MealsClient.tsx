"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MealCard, type Meal } from "@/components/meals/MealCard";
import { Button } from "@/components/ui/button";
import { Check, Search, Plus, Sparkles, Salad } from "lucide-react";

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
}

const QUICK_INGREDIENTS = [
  "Chicken breast", "Eggs", "Greek yogurt", "Cottage cheese",
  "Canned tuna", "Salmon", "Ground turkey", "Shrimp",
  "Tofu", "Edamame", "Lentils", "Black beans",
  "Quinoa", "Protein powder", "Lean beef", "Tempeh",
];

export function MealsClient({ userId, proteinGoalG, proteinLoggedG: initialLogged, dietaryPrefs }: Props) {
  const supabase = createClient();

  // ── Protein tracker (live) ──
  const [proteinLogged, setProteinLogged] = useState(initialLogged);
  const proteinRemaining = Math.max(0, proteinGoalG - proteinLogged);
  const pct = proteinGoalG > 0 ? Math.min(100, Math.round((proteinLogged / proteinGoalG) * 100)) : 0;

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

  // ── AI generation ──
  const [genMode, setGenMode] = useState<"magic" | "custom">("magic");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loggedMeals, setLoggedMeals] = useState<Set<string>>(new Set());
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Debounced USDA search
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
      setProteinLogged((p) => p + protein);
      setQuery("");
      setSelected(null);
      setResults([]);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to log food");
    } finally {
      setLogging(false);
    }
  }

  function toggleIngredient(ing: string) {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    setMeals([]);
    setLoggedMeals(new Set());
    setAiError(null);
    try {
      const body: Record<string, unknown> = { proteinRemainingG: proteinRemaining, dietaryPrefs };
      if (genMode === "custom" && selectedIngredients.length > 0) {
        body.ingredients = selectedIngredients;
      }
      const res = await fetch("/api/generate-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      setLoggedMeals((prev) => new Set(prev).add(meal.name));
      setProteinLogged((p) => p + meal.protein_g);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to log meal");
    } finally {
      setLoggingId(null);
    }
  }

  const nutrients = computedNutrients();

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">

      {/* ── Header + protein bar ── */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {proteinRemaining > 0
              ? <><span className="text-brand-700 font-semibold">{proteinRemaining}g protein</span> remaining today</>
              : <span className="text-green-600 font-semibold">Daily protein goal reached!</span>
            }
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{proteinLogged}g logged</span>
            <span>{proteinGoalG}g goal</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: pct >= 100 ? "#16a34a" : "#2e7d32",
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{pct}% complete</p>
        </div>
      </div>

      {/* ── Food Search ── */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Log a food</h2>
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
                {" · "}{nutrients.calories} kcal
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

      {/* ── AI Meal Generation ── */}
      <div className="space-y-4">

        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setGenMode("magic")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              genMode === "magic"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Magic
          </button>
          <button
            type="button"
            onClick={() => setGenMode("custom")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              genMode === "custom"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Salad className="h-4 w-4" />
            Choose ingredients
          </button>
        </div>

        {/* Custom: ingredient chips */}
        {genMode === "custom" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Select what you have available:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_INGREDIENTS.map((ing) => {
                const on = selectedIngredients.includes(ing);
                return (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => toggleIngredient(ing)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      on
                        ? "border-brand-700 bg-brand-50 text-brand-800 font-medium"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                    style={on ? { borderColor: "#2e7d32", backgroundColor: "#f1f8f1", color: "#1b5e20" } : {}}
                  >
                    {on && <span className="mr-1 text-xs">✓</span>}{ing}
                  </button>
                );
              })}
            </div>
            {selectedIngredients.length > 0 && (
              <p className="text-xs text-gray-400">
                {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating || (genMode === "custom" && selectedIngredients.length === 0)}
          className="w-full"
          size="lg"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {generating
            ? "Generating…"
            : genMode === "custom" && selectedIngredients.length > 0
              ? `Generate meals with ${selectedIngredients.length} ingredient${selectedIngredients.length !== 1 ? "s" : ""}`
              : "Generate today's meal ideas"
          }
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
                logged={loggedMeals.has(meal.name)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
