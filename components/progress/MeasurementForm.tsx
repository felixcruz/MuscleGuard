"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  onSaved: () => void;
}

export function MeasurementForm({ userId, onSaved }: Props) {
  const [weightKg, setWeightKg] = useState("");
  const [muscleMassKg, setMuscleMassKg] = useState("");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weightKg) return;
    setSaving(true);
    await supabase.from("body_measurements").insert({
      user_id: userId,
      measured_at: new Date().toISOString().split("T")[0],
      weight_kg: parseFloat(weightKg),
      muscle_mass_kg: muscleMassKg ? parseFloat(muscleMassKg) : null,
      body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : null,
    });
    setWeightKg("");
    setMuscleMassKg("");
    setBodyFatPct("");
    onSaved();
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="wt" className="text-xs font-medium text-mgray">Weight (kg) *</label>
          <input
            id="wt"
            type="number"
            step="0.1"
            placeholder="e.g. 83"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
            className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="mm" className="text-xs font-medium text-mgray">Muscle (kg)</label>
          <input
            id="mm"
            type="number"
            step="0.1"
            placeholder="optional"
            value={muscleMassKg}
            onChange={(e) => setMuscleMassKg(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
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
            className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
          />
        </div>
      </div>
      <p className="text-xs text-muted">
        Muscle mass from smart scale (Withings, Renpho, etc.) or DEXA scan.
      </p>
      <button
        type="submit"
        disabled={saving || !weightKg}
        className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Log today's measurement"}
      </button>
    </form>
  );
}
