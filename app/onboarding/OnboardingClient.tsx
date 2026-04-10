"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calcProteinGoal } from "@/lib/protein";

const TOTAL_STEPS = 4;

const MEDICATIONS = [
  { value: "semaglutide", label: "Semaglutide (Ozempic / Wegovy)" },
  { value: "tirzepatide", label: "Tirzepatide (Mounjaro / Zepbound)" },
  { value: "liraglutide", label: "Liraglutide (Saxenda / Victoza)" },
  { value: "other", label: "Other GLP-1" },
];

const DIET_PREFS = [
  { value: "omnivore", label: "Omnivore" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten_free", label: "Gluten-free" },
  { value: "lactose_free", label: "Dairy-free" },
  { value: "low_sodium", label: "Low sodium" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", desc: "Desk job, <3,000 steps/day" },
  { value: "light", label: "Light", desc: "Regular walks, 5,000–8,000 steps/day" },
  { value: "moderate", label: "Moderate", desc: "Training 2–3 times/week" },
  { value: "intense", label: "Intense", desc: "Strength 4+ times/week or sports" },
];

const BOWEL_PATTERNS = [
  { value: "daily", label: "Daily" },
  { value: "every2to3days", label: "Every 2–3 days" },
  { value: "lessThan2xWeek", label: "Less than 2x/week" },
];

const ALCOHOL_OPTIONS = [
  { value: "none", label: "None" },
  { value: "occasional", label: "Occasional" },
  { value: "regular", label: "Regular" },
  { value: "frequent", label: "Frequent" },
];

type Form = {
  medication: string;
  thyroid: string;
  dietaryPrefs: string[];
  age: string;
  weightKg: string;
  heightCm: string;
  sex: string;
  activityLevel: string;
  bowelPattern: string;
  alcoholConsumption: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [form, setForm] = useState<Form>({
    medication: "",
    thyroid: "",
    dietaryPrefs: [],
    age: "",
    weightKg: "",
    heightCm: "",
    sex: "",
    activityLevel: "",
    bowelPattern: "",
    alcoholConsumption: "",
  });

  function set(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldError(null);
  }

  function toggleDiet(val: string) {
    setForm((f) => ({
      ...f,
      dietaryPrefs: f.dietaryPrefs.includes(val)
        ? f.dietaryPrefs.filter((v) => v !== val)
        : [...f.dietaryPrefs, val],
    }));
    setFieldError(null);
  }

  function canAdvance(): boolean {
    if (step === 1) return !!form.medication && !!form.thyroid;
    if (step === 2) return form.dietaryPrefs.length > 0;
    if (step === 3) return !!form.age && !!form.weightKg && !!form.heightCm && !!form.sex && !!form.activityLevel;
    if (step === 4) return !!form.bowelPattern && !!form.alcoholConsumption;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const weightKg = parseFloat(form.weightKg);
    await supabase.from("profiles").upsert({
      id: user.id,
      glp1_medication: form.medication,
      dietary_prefs: form.dietaryPrefs,
      age: parseInt(form.age),
      weight_kg: weightKg,
      height_cm: parseInt(form.heightCm),
      sex: form.sex,
      activity_level: form.activityLevel,
      protein_goal_g: calcProteinGoal(weightKg, form.activityLevel),
      bowel_pattern: form.bowelPattern,
      alcohol_consumption: form.alcoholConsumption,
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    });

    setDone(true);
    setSaving(false);

    // Redirect to Stripe checkout after brief pause to show completion screen
    setTimeout(async () => {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push("/dashboard");
      }
    }, 3000);
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 16px 48px",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#1a1a1a" }}>MuscleGuard</span>
      </div>

      <div style={{ width: "100%", maxWidth: 540 }}>
        {/* Progress bar */}
        {!done && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#666" }}>Step {step} of {TOTAL_STEPS}</span>
              <span style={{ fontSize: 13, color: "#666" }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: "#ddd", borderRadius: 99 }}>
              <div style={{
                height: 6,
                background: "#2e7d32",
                borderRadius: 99,
                width: `${progress}%`,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        )}

        {/* Card */}
        <div style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: "28px 24px",
        }}>

          {/* ── DONE SCREEN ── */}
          {done && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
                Assessment complete
              </h2>
              <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
                Your personalized muscle preservation protocol is being generated:
              </p>
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Protein target adjusted to your dose (1.2–1.6 g/kg)",
                  "Resistance plan to protect lean mass",
                  "Hydration and fiber strategy for GLP-1",
                  "Body composition monitoring (not just weight)",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ color: "#2e7d32", fontWeight: 700, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 14, color: "#1a1a1a" }}>{item}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "#999", marginTop: 20 }}>Redirecting in a moment…</p>
            </div>
          )}

          {/* ── STEP 1: Medicación + Tiroides ── */}
          {!done && step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                Your GLP-1 medication
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                This helps us tailor your muscle preservation protocol.
              </p>

              <div style={{ background: "#e3f2fd", border: "1px solid #2196f3", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: "#1565c0", margin: 0 }}>
                  <strong>MuscleGuard</strong> is not a medical service. This app complements — does not replace — your doctor&apos;s supervision.
                </p>
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "block", marginBottom: 8 }}>
                Which medication are you taking?
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {MEDICATIONS.map((med) => (
                  <button
                    key={med.value}
                    type="button"
                    onClick={() => set("medication", med.value)}
                    style={{
                      textAlign: "left", padding: "11px 14px", borderRadius: 8, fontSize: 14,
                      border: form.medication === med.value ? "2px solid #2e7d32" : "1px solid #ddd",
                      background: form.medication === med.value ? "#f1f8f1" : "#fff",
                      color: "#1a1a1a", cursor: "pointer", fontWeight: form.medication === med.value ? 600 : 400,
                    }}
                  >
                    {med.label}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "block", marginBottom: 8 }}>
                Do you have a personal or family history of thyroid cancer or MEN-2 syndrome?
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("thyroid", opt.value)}
                    style={{
                      textAlign: "left", padding: "11px 14px", borderRadius: 8, fontSize: 14,
                      border: form.thyroid === opt.value ? "2px solid #2e7d32" : "1px solid #ddd",
                      background: form.thyroid === opt.value ? "#f1f8f1" : "#fff",
                      color: "#1a1a1a", cursor: "pointer", fontWeight: form.thyroid === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {form.thyroid === "yes" && (
                <div style={{ background: "#ffebee", border: "1px solid #f44336", borderRadius: 8, padding: "12px 14px", marginTop: 16 }}>
                  <p style={{ fontSize: 13, color: "#c62828", margin: 0, fontWeight: 600 }}>
                    ⚠ MuscleGuard cannot be used with a history of thyroid cancer or MEN-2.
                  </p>
                  <p style={{ fontSize: 13, color: "#c62828", margin: "6px 0 0" }}>
                    GLP-1 medications are contraindicated in these conditions. Please consult your doctor before continuing.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Preferencias dietéticas ── */}
          {!done && step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                Dietary preferences
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                Select all that apply. We&apos;ll use these to personalize your meal recommendations.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DIET_PREFS.map((pref) => {
                  const selected = form.dietaryPrefs.includes(pref.value);
                  return (
                    <button
                      key={pref.value}
                      type="button"
                      onClick={() => toggleDiet(pref.value)}
                      style={{
                        textAlign: "left", padding: "11px 14px", borderRadius: 8, fontSize: 14,
                        border: selected ? "2px solid #2e7d32" : "1px solid #ddd",
                        background: selected ? "#f1f8f1" : "#fff",
                        color: "#1a1a1a", cursor: "pointer", fontWeight: selected ? 600 : 400,
                        display: "flex", alignItems: "center", gap: 10,
                      }}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: 4, border: selected ? "none" : "1.5px solid #ccc",
                        background: selected ? "#2e7d32" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {selected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </span>
                      {pref.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: Biometría ── */}
          {!done && step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                Body metrics
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                We need this data to calculate your personalized protein target.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { field: "age" as keyof Form, label: "Age", placeholder: "e.g. 38", unit: "yrs", type: "number" },
                  { field: "weightKg" as keyof Form, label: "Weight", placeholder: "e.g. 82", unit: "kg", type: "number" },
                  { field: "heightCm" as keyof Form, label: "Height", placeholder: "e.g. 170", unit: "cm", type: "number" },
                ].map(({ field, label, placeholder, unit, type }) => (
                  <div key={field}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 4 }}>
                      {label}
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={form[field] as string}
                        onChange={(e) => set(field, e.target.value)}
                        style={{
                          width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #ddd",
                          fontSize: 14, color: "#1a1a1a", background: "#fff", boxSizing: "border-box",
                        }}
                      />
                      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#999" }}>
                        {unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "block", marginBottom: 8 }}>
                Biological sex
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("sex", opt.value)}
                    style={{
                      flex: 1, padding: "10px 6px", borderRadius: 8, fontSize: 13,
                      border: form.sex === opt.value ? "2px solid #2e7d32" : "1px solid #ddd",
                      background: form.sex === opt.value ? "#f1f8f1" : "#fff",
                      color: "#1a1a1a", cursor: "pointer", fontWeight: form.sex === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "block", marginBottom: 8 }}>
                Physical activity level
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ACTIVITY_LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => set("activityLevel", lvl.value)}
                    style={{
                      textAlign: "left", padding: "11px 14px", borderRadius: 8,
                      border: form.activityLevel === lvl.value ? "2px solid #2e7d32" : "1px solid #ddd",
                      background: form.activityLevel === lvl.value ? "#f1f8f1" : "#fff",
                      color: "#1a1a1a", cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{lvl.label}</div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Salud GI ── */}
          {!done && step === 4 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                Gastrointestinal health
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                GLP-1 medications directly affect gut motility. This helps us personalize your plan.
              </p>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "block", marginBottom: 8 }}>
                How often do you have a bowel movement?
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {BOWEL_PATTERNS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("bowelPattern", opt.value)}
                    style={{
                      textAlign: "left", padding: "11px 14px", borderRadius: 8, fontSize: 14,
                      border: form.bowelPattern === opt.value ? "2px solid #2e7d32" : "1px solid #ddd",
                      background: form.bowelPattern === opt.value ? "#f1f8f1" : "#fff",
                      color: "#1a1a1a", cursor: "pointer", fontWeight: form.bowelPattern === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "block", marginBottom: 8 }}>
                Alcohol consumption
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {ALCOHOL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("alcoholConsumption", opt.value)}
                    style={{
                      textAlign: "left", padding: "11px 14px", borderRadius: 8, fontSize: 14,
                      border: form.alcoholConsumption === opt.value ? "2px solid #2e7d32" : "1px solid #ddd",
                      background: form.alcoholConsumption === opt.value ? "#f1f8f1" : "#fff",
                      color: "#1a1a1a", cursor: "pointer", fontWeight: form.alcoholConsumption === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {form.alcoholConsumption && form.alcoholConsumption !== "none" && (
                <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ fontSize: 13, color: "#856404", margin: 0, fontWeight: 600 }}>
                    ⚠ Alcohol + GLP-1 = increased risk of pancreatitis and dehydration
                  </p>
                  <p style={{ fontSize: 13, color: "#856404", margin: "6px 0 0" }}>
                    The combination can intensify side effects. Your plan will include enhanced hydration strategies.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Field error */}
          {fieldError && !done && (
            <div style={{ background: "#ffebee", border: "1px solid #f44336", borderRadius: 8, padding: "10px 14px", marginTop: 16 }}>
              <p style={{ fontSize: 13, color: "#c62828", margin: 0 }}>{fieldError}</p>
            </div>
          )}

          {/* Navigation buttons */}
          {!done && (
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: "1px solid #ddd", background: "#fff", color: "#1a1a1a", cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 1 && form.thyroid === "yes"}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: "none",
                    background: step === 1 && form.thyroid === "yes" ? "#ccc" : "#2e7d32",
                    color: "#fff", cursor: step === 1 && form.thyroid === "yes" ? "not-allowed" : "pointer",
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: "none", background: saving ? "#ccc" : "#2e7d32",
                    color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving…" : "Complete →"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
