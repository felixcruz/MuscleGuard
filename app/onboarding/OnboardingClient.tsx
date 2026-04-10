"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calcProteinGoal } from "@/lib/protein";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StepWeight } from "@/components/onboarding/StepWeight";
import { StepMedication } from "@/components/onboarding/StepMedication";
import { StepDiet } from "@/components/onboarding/StepDiet";
import { StepGoal } from "@/components/onboarding/StepGoal";
import { Shield } from "lucide-react";

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    weightKg: "",
    targetWeightKg: "",
    medication: "",
    doseStr: "",
    titrationWeek: "",
    dietaryPrefs: [] as string[],
  });

  function updateField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function canContinue(): boolean {
    if (step === 1) return !!form.weightKg && !!form.targetWeightKg;
    if (step === 2) return !!form.medication;
    if (step === 3) return form.dietaryPrefs.length > 0;
    return true;
  }

  async function handleFinish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const weightKg = parseFloat(form.weightKg);
    await supabase.from("profiles").upsert({
      id: user.id,
      weight_kg: weightKg,
      target_weight_kg: parseFloat(form.targetWeightKg),
      glp1_medication: form.medication,
      glp1_dose_mg: form.doseStr ? parseFloat(form.doseStr) : null,
      titration_week: form.titrationWeek ? parseInt(form.titrationWeek) : null,
      dietary_prefs: form.dietaryPrefs,
      protein_goal_g: calcProteinGoal(weightKg),
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    });

    // Redirect to Stripe Checkout to collect card for the 7-day trial
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      // Stripe unavailable — go to dashboard, user can upgrade from settings
      router.push("/dashboard");
    }
  }

  const weightKgNum = parseFloat(form.weightKg) || 0;
  const targetKgNum = parseFloat(form.targetWeightKg) || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-brand-600" />
        <span className="font-semibold text-gray-800">MuscleGuard</span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-4">
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < step ? "bg-brand-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6">
          {step === 1 && (
            <StepWeight
              weightKg={form.weightKg}
              targetWeightKg={form.targetWeightKg}
              onChange={updateField}
            />
          )}
          {step === 2 && (
            <StepMedication
              medication={form.medication}
              doseStr={form.doseStr}
              titrationWeek={form.titrationWeek}
              onChange={updateField}
            />
          )}
          {step === 3 && (
            <StepDiet
              selectedPrefs={form.dietaryPrefs}
              onChange={(prefs) => setForm((f) => ({ ...f, dietaryPrefs: prefs }))}
            />
          )}
          {step === 4 && (
            <StepGoal weightKg={weightKgNum} targetWeightKg={targetKgNum} />
          )}

          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue()}
                className="flex-1"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Setting up…" : "Start protecting my muscle"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
