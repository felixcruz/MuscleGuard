"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, X } from "lucide-react";

interface FoodPortion {
  label: string;
  gramWeight: number;
}

interface USDAResult {
  fdcId: number;
  description: string;
  brandName: string | null;
  proteinPer100g: number;
  caloriesPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  portions: FoodPortion[];
}

interface Props {
  userId: string;
  onLogged: () => void;
}

export function QuickLogForm({ userId, onLogged }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<USDAResult[]>([]);
  const [selected, setSelected] = useState<USDAResult | null>(null);
  const [portionIdx, setPortionIdx] = useState(0);
  const [servings, setServings] = useState("1");
  const [mealType, setMealType] = useState<string>(() => {
    const h = new Date().getHours();
    if (h < 11) return "breakfast";
    if (h < 15) return "lunch";
    if (h < 17) return "snack";
    return "dinner";
  });
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const supabase = createClient();

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); setSearchError(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.error) setSearchError(data.error);
        setResults(data.foods ?? []);
      } catch {
        setSearchError("Search failed. Check your connection.");
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  function handleSelect(food: USDAResult) {
    setSelected(food);
    setResults([]);
    setQuery(food.description);
    setServings("1");
    // Default to first non-gram portion if available, else grams with 100
    if (food.portions.length > 2) {
      setPortionIdx(2); // First food-specific portion (after g and oz)
    } else {
      setPortionIdx(0);
      setServings("100");
    }
  }

  function getCalculated() {
    if (!selected) return { protein: 0, calories: 0, fat: 0, carbs: 0, grams: 0 };
    const portion = selected.portions[portionIdx] ?? selected.portions[0];
    const qty = parseFloat(servings) || 0;
    const totalGrams = portion.gramWeight * qty;
    return {
      protein: Math.round((selected.proteinPer100g * totalGrams) / 100),
      calories: Math.round((selected.caloriesPer100g * totalGrams) / 100),
      fat: Math.round((selected.fatPer100g * totalGrams) / 100 * 10) / 10,
      carbs: Math.round((selected.carbsPer100g * totalGrams) / 100 * 10) / 10,
      grams: Math.round(totalGrams),
    };
  }

  async function handleLog() {
    if (!selected) return;
    const calc = getCalculated();
    if (calc.grams <= 0) return;
    setSaving(true);
    await supabase.from("food_logs").insert({
      user_id: userId,
      food_name: selected.description + (selected.brandName ? ` (${selected.brandName})` : ""),
      protein_g: calc.protein,
      calories: calc.calories,
      portion_g: calc.grams,
      meal_type: mealType,
    });
    setQuery("");
    setSelected(null);
    setResults([]);
    setServings("1");
    setPortionIdx(0);
    onLogged();
    setSaving(false);
  }

  function handleClose() {
    setSelected(null);
    setQuery("");
    setResults([]);
  }

  const calc = getCalculated();

  return (
    <div className="space-y-3">
      {/* Search input */}
      {!selected && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search food (e.g. eggs, chicken, greek yogurt)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            className="w-full pl-9 pr-4 py-2.5 border border-black/10 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              Searching…
            </span>
          )}
        </div>
      )}

      {/* Search error */}
      {searchError && (
        <p className="text-xs text-[#FFB4AB] px-1">{searchError}</p>
      )}

      {/* Results list */}
      {results.length > 0 && !selected && (
        <div className="border border-black/5 rounded-[10px] bg-white max-h-64 overflow-y-auto divide-y divide-black/5 shadow-sm">
          {results.map((food) => (
            <button
              key={food.fdcId}
              type="button"
              onClick={() => handleSelect(food)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-obsidian truncate">{food.description}</p>
                <p className="text-xs text-mgray mt-0.5">
                  {food.caloriesPer100g} cal, {food.proteinPer100g}g protein per 100g
                  {food.brandName && <span className="text-muted"> · {food.brandName}</span>}
                </p>
              </div>
              <Plus className="h-5 w-5 text-muted shrink-0 ml-2" />
            </button>
          ))}
        </div>
      )}

      {/* Selected food detail */}
      {selected && (
        <div className="bg-surface border border-black/5 rounded-[10px] overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between px-4 pt-4 pb-2">
            <div>
              <p className="text-sm font-medium text-obsidian">{selected.description}</p>
              {selected.brandName && (
                <p className="text-xs text-mgray mt-0.5">{selected.brandName}</p>
              )}
            </div>
            <button onClick={handleClose} className="text-muted hover:text-obsidian p-1 -mr-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Serving controls */}
          <div className="px-4 py-3 space-y-3">
            {/* Serving size (unit selector) */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-mgray">Serving size</span>
              <select
                value={portionIdx}
                onChange={(e) => setPortionIdx(parseInt(e.target.value))}
                className="px-3 py-1.5 border border-black/10 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-obsidian/20 max-w-[180px]"
              >
                {selected.portions.map((p, i) => (
                  <option key={i} value={i}>
                    {p.label}{p.gramWeight > 1 && p.label !== "g" && p.label !== "oz" ? ` (${p.gramWeight}g)` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of servings */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-mgray">
                {selected.portions[portionIdx]?.label === "g" ? "Amount" : "Number of servings"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setServings(String(Math.max(0, (parseFloat(servings) || 0) - (selected.portions[portionIdx]?.label === "g" ? 10 : 0.5))))}
                  className="w-8 h-8 rounded-lg border border-black/10 bg-white text-obsidian flex items-center justify-center hover:bg-surface transition-colors text-lg"
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  step={selected.portions[portionIdx]?.label === "g" ? "1" : "0.5"}
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-16 px-2 py-1.5 border border-black/10 rounded-lg text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setServings(String((parseFloat(servings) || 0) + (selected.portions[portionIdx]?.label === "g" ? 10 : 0.5)))}
                  className="w-8 h-8 rounded-lg border border-black/10 bg-white text-obsidian flex items-center justify-center hover:bg-surface transition-colors text-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Macro breakdown */}
          <div className="px-4 py-3 border-t border-black/5">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-obsidian">{calc.calories}</p>
                <p className="text-[10px] text-mgray uppercase tracking-wider">Cal</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{calc.protein}g</p>
                <p className="text-[10px] text-mgray uppercase tracking-wider">Protein</p>
              </div>
              <div>
                <p className="text-lg font-bold text-obsidian">{calc.carbs}g</p>
                <p className="text-[10px] text-mgray uppercase tracking-wider">Carbs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-obsidian">{calc.fat}g</p>
                <p className="text-[10px] text-mgray uppercase tracking-wider">Fat</p>
              </div>
            </div>
          </div>

          {/* Meal type */}
          <div className="px-4 py-3 border-t border-black/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-mgray">Meal</span>
              <div className="flex gap-1 bg-white border border-black/5 rounded-lg p-0.5">
                {[
                  { value: "breakfast", label: "B", full: "Breakfast" },
                  { value: "lunch", label: "L", full: "Lunch" },
                  { value: "dinner", label: "D", full: "Dinner" },
                  { value: "snack", label: "S", full: "Snack" },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMealType(m.value)}
                    title={m.full}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      mealType === m.value
                        ? "bg-obsidian text-white"
                        : "text-mgray hover:text-obsidian"
                    }`}
                  >
                    {m.full}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Log button */}
          <div className="px-4 pb-4 pt-2">
            <button
              onClick={handleLog}
              disabled={saving || calc.grams <= 0}
              className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Logging…" : `Log ${calc.protein}g protein`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
