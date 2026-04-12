"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Check } from "lucide-react";
import { calculateProteinGoal, type Goal } from "@/lib/personalization";

const TOTAL_STEPS = 3;

const SEMAGLUTIDE_DOSES = [0.25, 0.5, 1.0, 1.7, 2.4];
const TIRZEPATIDE_DOSES = [2.5, 5, 7.5, 10, 12.5, 15];

const ACTIVITY_OPTIONS = [
  { value: "strength", label: "Strength training", emoji: "🏋️" },
  { value: "running", label: "Running", emoji: "🏃" },
  { value: "cycling", label: "Cycling", emoji: "🚴" },
  { value: "swimming", label: "Swimming", emoji: "🏊" },
  { value: "yoga", label: "Yoga / Pilates", emoji: "🧘" },
  { value: "padel", label: "Padel / Tennis", emoji: "🎾" },
  { value: "hiit", label: "HIIT / Hyrox", emoji: "🔥" },
  { value: "walking", label: "Walking", emoji: "🚶" },
];

const APPETITE_OPTIONS = [
  { value: "none", label: "No suppression", emoji: "😊" },
  { value: "mild", label: "Mild", emoji: "🙂" },
  { value: "moderate", label: "Moderate", emoji: "😐" },
  { value: "severe", label: "Severe", emoji: "😕" },
  { value: "very_severe", label: "Very severe", emoji: "😔" },
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Form = {
  weight_kg: string;
  primary_goal: string;
  medication: string;
  dose_mg: string;
  dose_other: string;
  frequency: string;
  injection_day: string;
  appetite_level: string;
  activity_types: string[];
  primary_activity: string;
  activity_frequency: string;
  experience_level: string;
  equipment: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

  const [form, setForm] = useState<Form>({
    weight_kg: "",
    primary_goal: "",
    medication: "",
    dose_mg: "",
    dose_other: "",
    frequency: "",
    injection_day: "",
    appetite_level: "",
    activity_types: [],
    primary_activity: "",
    activity_frequency: "",
    experience_level: "",
    equipment: "",
  });

  function set(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldError(null);
  }

  function toggleActivity(val: string) {
    setForm((f) => {
      const next = f.activity_types.includes(val)
        ? f.activity_types.filter((v) => v !== val)
        : [...f.activity_types, val];
      const primary =
        f.primary_activity && next.includes(f.primary_activity)
          ? f.primary_activity
          : "";
      return { ...f, activity_types: next, primary_activity: primary };
    });
    setFieldError(null);
  }

  function getDoses(): number[] {
    if (form.medication === "semaglutide") return SEMAGLUTIDE_DOSES;
    if (form.medication === "tirzepatide") return TIRZEPATIDE_DOSES;
    return [];
  }

  function canAdvance(): boolean {
    if (step === 1) {
      return parseFloat(form.weight_kg) > 0 && !!form.primary_goal;
    }
    if (step === 2) {
      const hasBasics = !!form.medication && !!form.frequency && !!form.appetite_level;
      const hasFreqDay = form.frequency !== "weekly" || !!form.injection_day;
      let hasDose = false;
      if (form.medication === "other") {
        hasDose = parseFloat(form.dose_other) > 0;
      } else {
        hasDose = !!form.dose_mg;
      }
      return hasBasics && hasDose && hasFreqDay;
    }
    if (step === 3) {
      const hasActivities = form.activity_types.length > 0;
      const hasPrimary =
        form.activity_types.length === 1 || !!form.primary_activity;
      const hasFreq = !!form.activity_frequency;
      const hasExp = !!form.experience_level;
      const needsEquipment = form.activity_types.includes("strength");
      const hasEquipment = !needsEquipment || !!form.equipment;
      return hasActivities && hasPrimary && hasFreq && hasExp && hasEquipment;
    }
    return true;
  }

  function handleNext() {
    if (!canAdvance()) {
      setFieldError("Please complete all questions before continuing.");
      return;
    }
    setFieldError(null);
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setFieldError(null);
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFinish() {
    if (!canAdvance()) {
      setFieldError("Please complete all questions before continuing.");
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const weightKg = weightUnit === "lbs"
      ? Math.round(parseFloat(form.weight_kg) * 0.453592 * 10) / 10
      : parseFloat(form.weight_kg);
    const goal = form.primary_goal as Goal;
    const doseMg =
      form.medication === "other"
        ? parseFloat(form.dose_other)
        : parseFloat(form.dose_mg);
    const proteinGoalG = calculateProteinGoal(weightKg, goal, doseMg);

    const primaryActivity =
      form.activity_types.length === 1
        ? form.activity_types[0]
        : form.primary_activity;

    const today = new Date().toISOString().split("T")[0];

    await supabase.from("profiles").upsert({
      id: user.id,
      weight_kg: weightKg,
      primary_goal: goal,
      glp1_medication: form.medication,
      glp1_dose_mg: doseMg,
      glp1_frequency: form.frequency,
      glp1_injection_day:
        form.frequency === "weekly" ? form.injection_day : null,
      appetite_level: form.appetite_level,
      activity_types: form.activity_types,
      primary_activity: primaryActivity,
      activity_frequency: form.activity_frequency,
      experience_level: form.experience_level,
      equipment: form.activity_types.includes("strength")
        ? form.equipment
        : "bodyweight",
      protein_goal_g: proteinGoalG,
      dietary_prefs: [],
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    });

    await supabase.from("medication_logs").insert({
      user_id: user.id,
      medication: form.medication,
      dose_mg: doseMg,
      change_date: today,
      change_type: "start",
    });

    setDone(true);
    setSaving(false);

    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100);
  const doses = getDoses();

  // Pill button helper
  const pillClass = (selected: boolean) =>
    `px-4 py-2.5 rounded-lg text-sm border transition-colors cursor-pointer ${
      selected
        ? "border-obsidian bg-obsidian text-white font-medium"
        : "border-black/5 bg-white text-mgray hover:border-black/10"
    }`;

  // Option card helper
  const optionClass = (selected: boolean) =>
    `w-full text-left px-4 py-3.5 rounded-[10px] border transition-colors cursor-pointer ${
      selected
        ? "border-obsidian bg-obsidian text-white"
        : "border-black/5 bg-white hover:border-black/10"
    }`;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-4 py-8 pb-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-obsidian" />
        <span className="font-semibold text-obsidian tracking-tight">MuscleGuard</span>
      </div>

      <div className="w-full max-w-[540px]">
        {/* Progress bar */}
        {!done && (
          <div className="mb-5">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-mgray">Step {step} of {TOTAL_STEPS}</span>
              <span className="text-xs text-mgray">{progress}%</span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-obsidian rounded-full transition-all duration-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-black/5 rounded-[14px] p-6 sm:p-7">

          {/* ── DONE SCREEN ── */}
          {done && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#CDFF00] flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-obsidian" />
              </div>
              <h2 className="text-xl font-bold text-obsidian mb-2">Assessment complete</h2>
              <p className="text-sm text-mgray mb-6">
                Your personalized muscle preservation protocol is being generated:
              </p>
              <div className="text-left space-y-3">
                {[
                  "Protein target adjusted to your dose",
                  "Resistance plan to protect lean mass",
                  "Activity-specific training protocol",
                  "Body composition monitoring (not just weight)",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#CDFF00] flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-obsidian" />
                    </div>
                    <span className="text-sm text-obsidian">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-mgray mt-6">Redirecting in a moment…</p>
            </div>
          )}

          {/* ── STEP 1: Body & Goal ── */}
          {!done && step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-obsidian mb-1">Your body and goal</h2>
              <p className="text-sm text-mgray mb-6">
                This helps us calculate your personalized protein target.
              </p>

              <label className="text-xs font-medium text-obsidian block mb-2">Current weight</label>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative max-w-[160px]">
                  <input
                    type="number"
                    placeholder={weightUnit === "kg" ? "e.g. 82" : "e.g. 180"}
                    value={form.weight_kg}
                    onChange={(e) => set("weight_kg", e.target.value)}
                    className="w-full px-3 py-2.5 pr-12 border border-black/10 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mgray font-medium">{weightUnit}</span>
                </div>
                <div className="flex bg-surface rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setWeightUnit("kg")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      weightUnit === "kg" ? "bg-obsidian text-white" : "text-mgray"
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit("lbs")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      weightUnit === "lbs" ? "bg-obsidian text-white" : "text-mgray"
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>

              <label className="text-xs font-medium text-obsidian block mb-2">What is your primary goal?</label>
              <div className="space-y-2.5">
                {[
                  { value: "preserve_muscle", label: "Preserve muscle", desc: "Maintain lean mass while losing weight on GLP-1" },
                  { value: "build_strength", label: "Build strength", desc: "Add muscle while managing weight" },
                  { value: "general_health", label: "General health", desc: "Stay active and feel better" },
                ].map((opt) => {
                  const selected = form.primary_goal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("primary_goal", opt.value)}
                      className={optionClass(selected)}
                    >
                      <div className={`text-sm font-medium ${selected ? "text-white" : "text-obsidian"}`}>
                        {opt.label}
                      </div>
                      <div className={`text-xs mt-1 ${selected ? "text-white/60" : "text-mgray"}`}>
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 2: GLP-1 Medication ── */}
          {!done && step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-obsidian mb-1">Your GLP-1 medication</h2>
              <p className="text-sm text-mgray mb-6">
                We use this to adjust your protein and training intensity.
              </p>

              {/* Section: Medication type */}
              <div className="bg-surface rounded-[10px] p-4 mb-4">
                <label className="text-xs font-medium text-obsidian block mb-2">Medication type</label>
                <div className="space-y-2">
                  {[
                    { value: "semaglutide", label: "Semaglutide (Ozempic / Wegovy)" },
                    { value: "tirzepatide", label: "Tirzepatide (Mounjaro / Zepbound)" },
                    { value: "other", label: "Other GLP-1" },
                  ].map((med) => {
                    const selected = form.medication === med.value;
                    return (
                      <button
                        key={med.value}
                        type="button"
                        onClick={() => { set("medication", med.value); set("dose_mg", ""); }}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                          selected
                            ? "border-obsidian bg-obsidian text-white font-medium"
                            : "border-black/5 bg-white text-mgray hover:border-black/10"
                        }`}
                      >
                        {med.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Current dose */}
              {form.medication && (
                <div className="bg-surface rounded-[10px] p-4 mb-4">
                  <label className="text-xs font-medium text-obsidian block mb-2">Current dose</label>
                  {form.medication === "other" ? (
                    <div className="relative max-w-[160px]">
                      <input
                        type="number"
                        placeholder="e.g. 1.0"
                        value={form.dose_other}
                        onChange={(e) => set("dose_other", e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 border border-black/10 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-obsidian/20 bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mgray font-medium">mg</span>
                    </div>
                  ) : (
                    <select
                      value={form.dose_mg}
                      onChange={(e) => set("dose_mg", e.target.value)}
                      className="px-3 py-2.5 border border-black/10 rounded-lg text-base bg-white min-w-[160px] focus:outline-none focus:ring-2 focus:ring-obsidian/20"
                    >
                      <option value="">Select dose…</option>
                      {doses.map((d) => (
                        <option key={d} value={String(d)}>{d} mg</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Section: Injection frequency */}
              <div className="bg-surface rounded-[10px] p-4 mb-4">
                <label className="text-xs font-medium text-obsidian block mb-2">Injection frequency</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "weekly", label: "Weekly" },
                    { value: "biweekly", label: "Every 2 weeks" },
                    { value: "monthly", label: "Monthly" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { set("frequency", opt.value); if (opt.value !== "weekly") set("injection_day", ""); }}
                      className={pillClass(form.frequency === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Injection day */}
              {form.frequency === "weekly" && (
                <div className="bg-surface rounded-[10px] p-4 mb-4">
                  <label className="text-xs font-medium text-obsidian block mb-2">Injection day</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const selected = form.injection_day === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => set("injection_day", day)}
                          className={`py-2 rounded-lg text-xs text-center transition-colors ${
                            selected
                              ? "bg-obsidian text-white font-semibold"
                              : "border border-black/5 bg-white text-mgray hover:border-black/10"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section: Appetite */}
              <div className="bg-surface rounded-[10px] p-4">
                <label className="text-xs font-medium text-obsidian block mb-2">Appetite suppression right now</label>
                <div className="space-y-2">
                {APPETITE_OPTIONS.map((opt) => {
                  const selected = form.appetite_level === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("appetite_level", opt.value)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm flex items-center gap-2.5 transition-colors ${
                        selected
                          ? "border-obsidian bg-obsidian text-white font-medium"
                          : "border-black/5 bg-white text-mgray hover:border-black/10"
                      }`}
                    >
                      <span className="text-base">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Activity ── */}
          {!done && step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-obsidian mb-1">Your activity</h2>
              <p className="text-sm text-mgray mb-6">
                Tell us about your exercise habits so we can build your training protocol.
              </p>

              {/* Section: Exercise types */}
              <div className="bg-surface rounded-[10px] p-4 mb-4">
                <label className="text-xs font-medium text-obsidian block mb-2">
                  What types of exercise do you do?{" "}
                  <span className="text-mgray font-normal">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.map((opt) => {
                    const selected = form.activity_types.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleActivity(opt.value)}
                        className={`px-3.5 py-2 rounded-full text-xs flex items-center gap-1.5 border transition-colors ${
                          selected
                            ? "border-obsidian bg-obsidian text-white font-medium"
                            : "border-black/5 bg-white text-mgray hover:border-black/10"
                        }`}
                      >
                        <span>{opt.emoji}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Primary activity */}
              {form.activity_types.length >= 2 && (
                <div className="bg-surface rounded-[10px] p-4 mb-4">
                  <label className="text-xs font-medium text-obsidian block mb-2">Which is your primary activity?</label>
                  <select
                    value={form.primary_activity}
                    onChange={(e) => set("primary_activity", e.target.value)}
                    className="px-3 py-2.5 border border-black/10 rounded-lg text-base bg-white min-w-[200px] focus:outline-none focus:ring-2 focus:ring-obsidian/20"
                  >
                    <option value="">Select primary activity…</option>
                    {form.activity_types.map((act) => {
                      const opt = ACTIVITY_OPTIONS.find((o) => o.value === act);
                      return opt ? (
                        <option key={act} value={act}>{opt.emoji} {opt.label}</option>
                      ) : null;
                    })}
                  </select>
                </div>
              )}

              {/* Section: Frequency */}
              <div className="bg-surface rounded-[10px] p-4 mb-4">
                <label className="text-xs font-medium text-obsidian block mb-2">How often do you exercise?</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "1_2x", label: "1-2x/week" },
                    { value: "3_4x", label: "3-4x/week" },
                    { value: "5x_plus", label: "5+x/week" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("activity_frequency", opt.value)}
                      className={pillClass(form.activity_frequency === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Experience */}
              <div className="bg-surface rounded-[10px] p-4 mb-4">
                <label className="text-xs font-medium text-obsidian block mb-2">Experience level</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("experience_level", opt.value)}
                      className={pillClass(form.experience_level === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Equipment */}
              {form.activity_types.includes("strength") && (
                <div className="bg-surface rounded-[10px] p-4">
                  <label className="text-xs font-medium text-obsidian block mb-2">Equipment available</label>
                  <div className="space-y-2">
                    {[
                      { value: "gym", label: "Full gym", emoji: "🏋️" },
                      { value: "dumbbells", label: "Dumbbells at home", emoji: "💪" },
                      { value: "bodyweight", label: "Bodyweight only", emoji: "🤸" },
                    ].map((opt) => {
                      const selected = form.equipment === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set("equipment", opt.value)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm flex items-center gap-2.5 transition-colors ${
                            selected
                              ? "border-obsidian bg-obsidian text-white font-medium"
                              : "border-black/5 bg-white text-mgray hover:border-black/10"
                          }`}
                        >
                          <span className="text-base">{opt.emoji}</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Field error */}
          {fieldError && !done && (
            <div className="mt-4 p-3 bg-[#FFB4AB]/10 border border-[#FFB4AB]/20 rounded-lg">
              <p className="text-sm text-obsidian">{fieldError}</p>
            </div>
          )}

          {/* Navigation buttons */}
          {!done && (
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-black/10 bg-white text-obsidian hover:bg-surface transition-colors"
                >
                  Back
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-obsidian text-white hover:bg-obsidian-light transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-obsidian text-white hover:bg-obsidian-light transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Complete"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
