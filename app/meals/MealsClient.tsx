"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MealCard, type Meal } from "@/components/meals/MealCard";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Props {
  userId: string;
  proteinRemainingG: number;
  dietaryPrefs: string[];
}

export function MealsClient({ userId, proteinRemainingG, dietaryPrefs }: Props) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // NOTE: createClient() is memoized in Supabase SSR, so this is already optimized
  const supabase = createClient();

  async function handleGenerate() {
    setGenerating(true);
    setMeals([]);
    setError(null);
    try {
      const res = await fetch("/api/generate-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proteinRemainingG, dietaryPrefs }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      setMeals(data.meals ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate meals";
      setError(message);
      setMeals([]);
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
      const message = err instanceof Error ? err.message : "Failed to log meal";
      setError(message);
    } finally {
      setLoggingId(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meal ideas</h1>
        <p className="text-gray-500 mt-1">
          You need{" "}
          <span className="text-brand-700 font-semibold">{proteinRemainingG}g more protein</span>{" "}
          today. Here are meals that fit your appetite.
        </p>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full"
        size="lg"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {generating ? "Generating your meals…" : "Generate today's meal ideas"}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
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
  );
}
