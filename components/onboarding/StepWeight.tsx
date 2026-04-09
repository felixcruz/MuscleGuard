"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  weightKg: string;
  targetWeightKg: string;
  onChange: (field: string, value: string) => void;
}

export function StepWeight({ weightKg, targetWeightKg, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Your current weight</h2>
        <p className="text-sm text-gray-500 mt-1">
          We use this to calculate your minimum daily protein goal (1.6g per kg).
        </p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="weight">Current weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="30"
            max="300"
            placeholder="e.g. 85"
            value={weightKg}
            onChange={(e) => onChange("weightKg", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="target">Target weight (kg)</Label>
          <Input
            id="target"
            type="number"
            step="0.1"
            min="30"
            max="300"
            placeholder="e.g. 72"
            value={targetWeightKg}
            onChange={(e) => onChange("targetWeightKg", e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
