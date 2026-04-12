"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

interface USDAResult {
  fdcId: number;
  description: string;
  proteinPer100g: number;
  caloriesPer100g: number;
}

interface Props {
  userId: string;
  onLogged: () => void;
}

export function QuickLogForm({ userId, onLogged }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<USDAResult[]>([]);
  const [selected, setSelected] = useState<USDAResult | null>(null);
  const [portionG, setPortionG] = useState("100");
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
        setSearchError("Search failed — check your connection.");
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  const proteinG = selected
    ? Math.round((selected.proteinPer100g * parseFloat(portionG || "0")) / 100)
    : 0;

  const caloriesVal = selected
    ? Math.round((selected.caloriesPer100g * parseFloat(portionG || "0")) / 100)
    : 0;

  async function handleLog() {
    if (!selected || !portionG) return;
    setSaving(true);
    await supabase.from("food_logs").insert({
      user_id: userId,
      food_name: selected.description,
      protein_g: proteinG,
      calories: caloriesVal,
      portion_g: parseInt(portionG),
    });
    setQuery("");
    setSelected(null);
    setPortionG("100");
    setResults([]);
    onLogged();
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <Input
          placeholder="Search food (e.g. chicken breast, Greek yogurt…)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          className="pl-9 rounded-lg border-black/10"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            Searching…
          </span>
        )}
      </div>

      {searchError && (
        <p className="text-xs text-[#FFB4AB] px-1">{searchError}</p>
      )}

      {results.length > 0 && !selected && (
        <div className="border border-black/5 rounded-[10px] shadow-sm bg-white max-h-52 overflow-y-auto divide-y divide-black/5">
          {results.map((food) => (
            <button
              key={food.fdcId}
              type="button"
              className="w-full text-left px-4 py-2.5 hover:bg-surface text-sm transition-colors"
              onClick={() => { setSelected(food); setQuery(food.description); setResults([]); }}
            >
              <span className="font-medium text-obsidian">{food.description}</span>
              <span className="text-muted ml-2">
                {food.proteinPer100g.toFixed(1)}g protein / 100g
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-mgray block mb-1">Portion (g)</label>
            <Input
              type="number"
              min="1"
              max="2000"
              value={portionG}
              onChange={(e) => setPortionG(e.target.value)}
              className="rounded-lg border-black/10"
            />
          </div>
          <div className="text-sm pb-2.5 w-28">
            <span className="font-semibold text-green-600">{proteinG}g protein</span>
            <span className="text-muted block text-xs">{caloriesVal} kcal</span>
          </div>
          <button
            onClick={handleLog}
            disabled={saving}
            className="mb-0.5 px-4 py-2 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {saving ? "…" : "Log"}
          </button>
        </div>
      )}
    </div>
  );
}
