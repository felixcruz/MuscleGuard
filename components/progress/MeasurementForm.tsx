"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  onSaved: () => void;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

export function MeasurementForm({ userId, onSaved }: Props) {
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [weight, setWeight] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  function switchUnit(newUnit: "kg" | "lbs") {
    if (newUnit === unit) return;
    const convert = newUnit === "lbs" ? kgToLbs : lbsToKg;
    if (weight) setWeight(String(convert(parseFloat(weight))));
    if (muscleMass) setMuscleMass(String(convert(parseFloat(muscleMass))));
    setUnit(newUnit);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    const toKg = unit === "lbs" ? lbsToKg : (v: number) => v;
    await supabase.from("body_measurements").insert({
      user_id: userId,
      measured_at: new Date().toISOString().split("T")[0],
      weight_kg: toKg(parseFloat(weight)),
      muscle_mass_kg: muscleMass ? toKg(parseFloat(muscleMass)) : null,
      body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : null,
    });
    setWeight("");
    setMuscleMass("");
    setBodyFatPct("");
    onSaved();
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Unit toggle */}
      <div className="flex justify-end">
        <div className="flex bg-surface rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => switchUnit("kg")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              unit === "kg" ? "bg-obsidian text-white" : "text-mgray"
            }`}
          >
            kg
          </button>
          <button
            type="button"
            onClick={() => switchUnit("lbs")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              unit === "lbs" ? "bg-obsidian text-white" : "text-mgray"
            }`}
          >
            lbs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="wt" className="text-xs font-medium text-mgray">Weight ({unit}) *</label>
          <input
            id="wt"
            type="number"
            step="0.1"
            placeholder={unit === "kg" ? "e.g. 83" : "e.g. 183"}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
            className="w-full px-3 py-2 border border-black/10 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="mm" className="text-xs font-medium text-mgray">Muscle ({unit})</label>
          <input
            id="mm"
            type="number"
            step="0.1"
            placeholder="optional"
            value={muscleMass}
            onChange={(e) => setMuscleMass(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="bf" className="text-xs font-medium text-mgray">Body fat %</label>
          <input
            id="bf"
            type="number"
            step="0.1"
            placeholder="optional"
            value={bodyFatPct}
            onChange={(e) => setBodyFatPct(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
          />
        </div>
      </div>
      <p className="text-xs text-mgray">
        Muscle mass from smart scale (Withings, Renpho, etc.) or DEXA scan.
      </p>
      <button
        type="submit"
        disabled={saving || !weight}
        className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Log today's measurement"}
      </button>
    </form>
  );
}
