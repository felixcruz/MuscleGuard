"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const MEDICATIONS = [
  { value: "semaglutide", label: "Semaglutide (Ozempic / Wegovy)" },
  { value: "tirzepatide", label: "Tirzepatide (Mounjaro / Zepbound)" },
  { value: "liraglutide", label: "Liraglutide (Saxenda / Victoza)" },
  { value: "other", label: "Other GLP-1" },
];

interface Props {
  medication: string;
  doseStr: string;
  titrationWeek: string;
  onChange: (field: string, value: string) => void;
}

export function StepMedication({ medication, doseStr, titrationWeek, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Your GLP-1 medication</h2>
        <p className="text-sm text-gray-500 mt-1">
          This helps us understand your current appetite suppression level.
        </p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Medication</Label>
          <div className="grid grid-cols-1 gap-2">
            {MEDICATIONS.map((med) => (
              <button
                key={med.value}
                type="button"
                onClick={() => onChange("medication", med.value)}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  medication === med.value
                    ? "border-brand-600 bg-brand-50 text-brand-800 font-medium"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {med.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="dose">Current dose (mg)</Label>
            <Input
              id="dose"
              type="number"
              step="0.25"
              min="0.25"
              max="15"
              placeholder="e.g. 0.5"
              value={doseStr}
              onChange={(e) => onChange("doseStr", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="week">Titration week</Label>
            <Input
              id="week"
              type="number"
              min="1"
              max="104"
              placeholder="e.g. 4"
              value={titrationWeek}
              onChange={(e) => onChange("titrationWeek", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
