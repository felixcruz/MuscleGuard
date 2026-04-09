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
  const supabase = createClient();

  async function handleGenerate() {
    setGenerating(true);
    setMeals([]);
    try {
      const res = await fetch("/api/generate-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proteinRemainingG, dietaryPrefs }),
      });
      const data = await res.json();
      setMeals(data.meals ?? []);
    } finally {
      setGenerating(false);
    }
  }

  async function handleLogMeal(meal: Meal) {
    setLoggingId(meal.name);
    await supabase.from("food_logs").insert({
      user_id: userId,
      food_name: meal.name,
      protein_g: meal.protein_g,
      calories: meal.calories,
      portion_g: meal.portion_g,
    });
    setLoggingId(null);
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

      {generating && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {meals.length > 0 && (
        <div className="space-y-4">
          {meals.map((meal) => (
            <MealCard
              key={meal.name}
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
