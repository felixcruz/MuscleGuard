"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Sunrise, Sun, Moon, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { MealCard, type Meal } from "./MealCard";

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
        style={{ backgroundColor: "#131413" }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: "#CDFF00" }} />
      </div>
      <div className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-obsidian max-w-xs leading-relaxed">
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
        style={{ backgroundColor: "#131413" }}
      >
        {children}
      </div>
    </div>
  );
}

export function MealWizard({ userId, proteinRemainingG, dietaryPrefs, onMealLogged }: Props) {
  const t = useTranslations("meals");
  const tc = useTranslations("common");
  const supabase = createClient();

  const MEAL_TIMES = [
    { value: "breakfast", label: t("breakfast"), icon: Sunrise },
    { value: "lunch", label: t("lunch"), icon: Sun },
    { value: "dinner", label: t("dinner"), icon: Moon },
    { value: "snack", label: t("snack"), icon: Cookie },
  ];

  const HUNGER_LEVELS = [
    { value: "low", label: `🤏 ${t("notHungry")}` },
    { value: "moderate", label: `😐 ${t("couldEat")}` },
    { value: "high", label: `😋 ${t("reallyHungry")}` },
  ];
  const [step, setStep] = useState(0); // 0=q1, 1=q2, 2=q3, 3=results
  const [mealTime, setMealTime] = useState<string | null>(null);
  const [hungerLevel, setHungerLevel] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [customRequest, setCustomRequest] = useState("");
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
          customRequest: customRequest.trim() || undefined,
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
          <p className="text-sm font-semibold text-obsidian">{t("yourMeals")}</p>
          <button
            onClick={reset}
            className="text-xs hover:underline"
            style={{ color: "#131413" }}
          >
            {t("startOver")}
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
      <AiBubble>{t("whatMeal")}</AiBubble>

      {mealTime ? (
        <UserBubble>{MEAL_TIMES.find((m) => m.value === mealTime)?.label}</UserBubble>
      ) : (
        <div className="flex flex-wrap gap-2 pl-9">
          {MEAL_TIMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setMealTime(value); setStep(1); }}
              className="px-4 py-2 rounded-full border border-black/5 bg-white text-sm text-mgray hover:border-black/10 hover:bg-surface transition-colors flex items-center gap-1.5"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Q2: Hunger */}
      {step >= 1 && (
        <>
          <AiBubble>{t("howAppetite")}</AiBubble>

          {hungerLevel ? (
            <UserBubble>{HUNGER_LEVELS.find((h) => h.value === hungerLevel)?.label}</UserBubble>
          ) : (
            <div className="flex flex-wrap gap-2 pl-9">
              {HUNGER_LEVELS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setHungerLevel(value); setStep(2); }}
                  className="px-4 py-2 rounded-full border border-black/5 bg-white text-sm text-mgray hover:border-black/10 hover:bg-surface transition-colors"
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
            {t("anyIngredients")}{" "}
            <span className="text-gray-500 text-xs">({tc("optional")})</span>
          </AiBubble>

          {generating ? (
            <div className="pl-9 flex items-center gap-2 text-sm text-mgray py-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#131413", borderTopColor: "transparent" }}
              />
              {t("generatingMeals")}
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
                          : "border-black/5 bg-white text-mgray hover:border-black/10"
                      }`}
                      style={
                        on
                          ? { borderColor: "#131413", backgroundColor: "#f7f7f7", color: "#131413" }
                          : {}
                      }
                    >
                      {on && "✓ "}
                      {ing}
                    </button>
                  );
                })}
              </div>

              {/* Custom request */}
              <input
                type="text"
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="e.g. something easy with eggs, under 10 minutes"
                className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white text-obsidian placeholder:text-muted"
              />

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => generate(ingredients)}
                  disabled={generating}
                  className="flex-1 bg-obsidian text-white hover:bg-obsidian-light"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  {t("generateMeals")}
                </Button>
                {(ingredients.length > 0 || customRequest.trim()) && (
                  <button
                    onClick={() => { setIngredients([]); setCustomRequest(""); }}
                    className="text-xs text-muted hover:text-obsidian px-2 py-1"
                  >
                    {t("clear")}
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
