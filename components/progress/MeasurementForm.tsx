"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          <Label htmlFor="wt">Weight (kg) *</Label>
          <Input
            id="wt"
            type="number"
            step="0.1"
            placeholder="e.g. 83"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mm">Muscle (kg)</Label>
          <Input
            id="mm"
            type="number"
            step="0.1"
            placeholder="optional"
            value={muscleMassKg}
            onChange={(e) => setMuscleMassKg(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bf">Body fat %</Label>
          <Input
            id="bf"
            type="number"
            step="0.1"
            placeholder="optional"
            value={bodyFatPct}
            onChange={(e) => setBodyFatPct(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Muscle mass from smart scale (Withings, Renpho, etc.) or DEXA scan.
      </p>
      <Button type="submit" disabled={saving || !weightKg} className="w-full">
        {saving ? "Saving…" : "Log today's measurement"}
      </Button>
    </form>
  );
}
