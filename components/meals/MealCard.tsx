"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Card>
      <CardContent className="pt-5 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{meal.name}</h3>
          <Badge variant="default">{meal.protein_g}g protein</Badge>
        </div>

        <div className="flex gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" /> {meal.calories} kcal
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {meal.prep_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="h-3.5 w-3.5" /> {meal.portion_g}g portion
          </span>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ingredients</p>
          <ul className="text-sm text-gray-700 space-y-0.5">
            {meal.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-brand-500 mt-0.5">·</span> {ing}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-gray-600 italic">{meal.instructions}</p>

        {logged ? (
          <div className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
            <Check className="h-4 w-4" />
            Logged!
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => onLog(meal)}
            disabled={logging}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            {logging ? "Logging…" : "Log this meal"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
