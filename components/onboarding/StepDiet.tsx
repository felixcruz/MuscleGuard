"use client";

import { Label } from "@/components/ui/label";

const DIET_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "dairy-free", label: "Dairy-free" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "nut-free", label: "Nut-free" },
  { value: "no-restrictions", label: "No restrictions" },
];

interface Props {
  selectedPrefs: string[];
  onChange: (prefs: string[]) => void;
}

export function StepDiet({ selectedPrefs, onChange }: Props) {
  function toggle(value: string) {
    if (value === "no-restrictions") {
      onChange(["no-restrictions"]);
      return;
    }
    const filtered = selectedPrefs.filter((p) => p !== "no-restrictions");
    if (filtered.includes(value)) {
      onChange(filtered.filter((p) => p !== value));
    } else {
      onChange([...filtered, value]);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Dietary preferences</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select all that apply. We&apos;ll only suggest meals that fit your needs.
        </p>
      </div>
      <div>
        <Label className="mb-3 block">Diet &amp; restrictions</Label>
        <div className="grid grid-cols-2 gap-2">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                selectedPrefs.includes(opt.value)
                  ? "border-brand-600 bg-brand-50 text-brand-800 font-medium"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
