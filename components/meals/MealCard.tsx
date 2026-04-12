"use client";

import { Check, Clock, Dumbbell, Flame, Plus } from "lucide-react";

export interface Meal {
  name: string;
  protein_g: number;
  calories: number;
  prep_minutes: number;
  portion_g: number;
  ingredients: string[];
  instructions: string;
}

interface Props {
  meal: Meal;
  onLog: (meal: Meal) => void;
  logging?: boolean;
  logged?: boolean;
}

export function MealCard({ meal, onLog, logging, logged }: Props) {
  return (
    <div className="bg-white border border-black/5 rounded-[10px] p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-obsidian">{meal.name}</h3>
        <span className="shrink-0 px-2.5 py-1 bg-obsidian text-white text-xs font-medium rounded-md">
          {meal.protein_g}g protein
        </span>
      </div>

      <div className="flex gap-4 text-sm text-mgray">
        <span className="flex items-center gap-1">
          <Flame className="h-3.5 w-3.5" /> {meal.calories} kcal
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {meal.prep_minutes} min
        </span>
        <span className="flex items-center gap-1">
          <Dumbbell className="h-3.5 w-3.5" /> {meal.portion_g}g
        </span>
      </div>

      <div>
        <p className="text-[10px] font-medium text-muted uppercase tracking-widest mb-1.5">Ingredients</p>
        <ul className="text-sm text-mgray space-y-0.5">
          {meal.ingredients.map((ing, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-muted mt-0.5">·</span> {ing}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-mgray italic">{meal.instructions}</p>

      {logged ? (
        <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-obsidian text-sm font-medium">
          <div className="w-5 h-5 rounded-full bg-[#CDFF00] flex items-center justify-center">
            <Check className="h-3 w-3 text-obsidian" />
          </div>
          <span className="text-white">Logged!</span>
        </div>
      ) : (
        <button
          onClick={() => onLog(meal)}
          disabled={logging}
          className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {logging ? "Logging…" : "Log this meal"}
        </button>
      )}
    </div>
  );
}
