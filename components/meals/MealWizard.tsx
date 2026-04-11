"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { MealCard, type Meal } from "./MealCard";

const MEAL_TIMES = [
  { value: "breakfast", label: "🌅 Breakfast" },
  { value: "lunch", label: "☀️ Lunch" },
  { value: "dinner", label: "🌙 Dinner" },
  { value: "snack", label: "⚡ Snack" },
];

const HUNGER_LEVELS = [
  { value: "low", label: "🤏 Not very hungry" },
  { value: "moderate", label: "😐 Could eat" },
  { value: "high", label: "😋 Really hungry" },
];

const INGREDIENTS = [
  "Chicken breast", "Eggs", "Greek yogurt", "Cottage cheese",
  "Canned tuna", "Salmon", "Ground turkey", "Shrimp",
  "Tofu", "Edamame", "Lentils", "Black beans",
  "Quinoa", "Protein powder", "Lean beef", "Tempeh",
];

interface Props {
  userId: string;
  proteinRemainingG: number;
  dietaryPrefs: string[];
  onMealLogged: (proteinG: number) => void;
}

function AiBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: "#e8f5e9" }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: "#2e7d32" }} />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 max-w-xs leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div
        className="px-4 py-2 rounded-2xl rounded-tr-sm text-sm font-medium text-white"
        style={{ backgroundColor: "#2e7d32" }}
      >
        {children}
      </div>
    </div>
  );
}

export function MealWizard({ userId, proteinRemainingG, dietaryPrefs, onMealLogged }: Props) {
  const supabase = createClient();
  const [step, setStep] = useState(0); // 0=q1, 1=q2, 2=q3, 3=results
  const [mealTime, setMealTime] = useState<string | null>(null);
  const [hungerLevel, setHungerLevel] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loggedMeals, setLoggedMeals] = useState<Set<string>>(new Set());
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleIngredient(ing: string) {
    setIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  }

  async function generate(selectedIngredients: string[]) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proteinRemainingG,
          dietaryPrefs,
          mealTime,
          hungerLevel,
          ingredients: selectedIngredients.length > 0 ? selectedIngredients : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setMeals(data.meals ?? []);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate meals");
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
      onMealLogged(meal.protein_g);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log meal");
    } finally {
      setLoggingId(null);
    }
  }

  function reset() {
    setStep(0);
    setMealTime(null);
    setHungerLevel(null);
    setIngredients([]);
    setMeals([]);
    setLoggedMeals(new Set());
    setError(null);
    setGenerating(false);
  }

  if (step === 3) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Your personalized meals</p>
          <button
            onClick={reset}
            className="text-xs hover:underline"
            style={{ color: "#2e7d32" }}
          >
            Start over
          </button>
        </div>
        {meals.map((meal, i) => (
          <MealCard
            key={`${i}-${meal.name}`}
            meal={meal}
            onLog={handleLogMeal}
            logging={loggingId === meal.name}
            logged={loggedMeals.has(meal.name)}
          />
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Q1: Meal time */}
      <AiBubble>What meal are you planning?</AiBubble>

      {mealTime ? (
        <UserBubble>{MEAL_TIMES.find((m) => m.value === mealTime)?.label}</UserBubble>
      ) : (
        <div className="flex flex-wrap gap-2 pl-9">
          {MEAL_TIMES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setMealTime(value); setStep(1); }}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Q2: Hunger */}
      {step >= 1 && (
        <>
          <AiBubble>How&rsquo;s your appetite right now?</AiBubble>

          {hungerLevel ? (
            <UserBubble>{HUNGER_LEVELS.find((h) => h.value === hungerLevel)?.label}</UserBubble>
          ) : (
            <div className="flex flex-wrap gap-2 pl-9">
              {HUNGER_LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setHungerLevel(value); setStep(2); }}
                  className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Q3: Ingredients */}
      {step >= 2 && (
        <>
          <AiBubble>
            Any ingredients you&rsquo;d like to use?{" "}
            <span className="text-gray-500 text-xs">(optional)</span>
          </AiBubble>

          {generating ? (
            <div className="pl-9 flex items-center gap-2 text-sm text-gray-500 py-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#2e7d32", borderTopColor: "transparent" }}
              />
              Generating your meals…
            </div>
          ) : (
            <div className="pl-9 space-y-3">
              <div className="flex flex-wrap gap-2">
                {INGREDIENTS.map((ing) => {
                  const on = ingredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleIngredient(ing)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        on
                          ? "font-medium"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                      style={
                        on
                          ? { borderColor: "#2e7d32", backgroundColor: "#e8f5e9", color: "#1b5e20" }
                          : {}
                      }
                    >
                      {on && "✓ "}
                      {ing}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => generate(ingredients)}
                  disabled={generating}
                  className="flex-1"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {ingredients.length > 0
                    ? `Generate with ${ingredients.length} ingredient${ingredients.length !== 1 ? "s" : ""}`
                    : "Generate meals"}
                </Button>
                {ingredients.length > 0 && (
                  <button
                    onClick={() => setIngredients([])}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-red-600 pl-9">{error}</p>}
    </div>
  );
}
