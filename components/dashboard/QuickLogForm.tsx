"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const supabase = createClient();

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.foods ?? []);
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search food (e.g. chicken breast, Greek yogurt…)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          className="pl-9"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Searching…
          </span>
        )}
      </div>

      {/* Dropdown results */}
      {results.length > 0 && !selected && (
        <div className="border rounded-md shadow-sm bg-white max-h-52 overflow-y-auto divide-y">
          {results.map((food) => (
            <button
              key={food.fdcId}
              type="button"
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"
              onClick={() => { setSelected(food); setQuery(food.description); setResults([]); }}
            >
              <span className="font-medium">{food.description}</span>
              <span className="text-gray-400 ml-2">
                {food.proteinPer100g.toFixed(1)}g protein / 100g
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Portion (g)</label>
            <Input
              type="number"
              min="1"
              max="2000"
              value={portionG}
              onChange={(e) => setPortionG(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-600 pb-2.5 w-28">
            <span className="font-semibold text-brand-700">{proteinG}g protein</span>
            <span className="text-gray-400 block text-xs">{caloriesVal} kcal</span>
          </div>
          <Button onClick={handleLog} disabled={saving} size="sm" className="mb-0.5">
            <Plus className="h-4 w-4 mr-1" />
            {saving ? "Saving…" : "Log"}
          </Button>
        </div>
      )}
    </div>
  );
}
