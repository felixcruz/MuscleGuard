"use client";

import { PROTEIN_MIN_PER_KG, PROTEIN_MAX_PER_KG } from "@/lib/personalization";
import { Dumbbell, Zap, Apple } from "lucide-react";

interface Props {
  weightKg: number;
  targetWeightKg: number;
}

export function StepGoal({ weightKg, targetWeightKg }: Props) {
  const proteinLow = Math.round(weightKg * PROTEIN_MIN_PER_KG);
  const proteinHigh = Math.round(weightKg * PROTEIN_MAX_PER_KG);
  const tolose = Math.max(0, weightKg - targetWeightKg);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Your Stoova plan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Based on your stats, here&apos;s what we&apos;ll track for you every day.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-brand-50 border border-brand-200">
          <Dumbbell className="h-6 w-6 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-brand-800">
              {proteinLow}–{proteinHigh}g protein / day
            </p>
            <p className="text-sm text-brand-700">
              A common range of 1.2 to 1.6 g per kg. We&apos;ll set your exact
              target from your goal and dose. Talk to your care team.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <Apple className="h-6 w-6 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">
              Small, dense meals
            </p>
            <p className="text-sm text-blue-700">
              200–300g portions optimized for GLP-1 reduced appetite
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
          <Zap className="h-6 w-6 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-purple-800">
              20-min strength training, 3×/week
            </p>
            <p className="text-sm text-purple-700">
              Resistance training that supports muscle during weight loss
            </p>
          </div>
        </div>
      </div>

      {tolose > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Goal: lose {tolose.toFixed(1)}kg while keeping your muscle.
        </p>
      )}
    </div>
  );
}
