"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  // Screen 1
  weight_kg: string;
  primary_goal: string;
  // Screen 2
  medication: string;
  dose_mg: string;
  dose_other: string;
  frequency: string;
  injection_day: string;
  appetite_level: string;
  // Screen 3
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
      // Reset primary_activity if removed
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

    const weightKg = parseFloat(form.weight_kg);
    const goal = form.primary_goal as Goal;
    const doseMg =
      form.medication === "other"
        ? parseFloat(form.dose_other)
        : parseFloat(form.dose_mg);
    const proteinGoalG = calculateProteinGoal(weightKg, goal, doseMg);

    // Compute primary_activity
    const primaryActivity =
      form.activity_types.length === 1
        ? form.activity_types[0]
        : form.primary_activity;

    const today = new Date().toISOString().split("T")[0];

    // Upsert profile
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

    // Insert medication log
    await supabase.from("medication_logs").insert({
      user_id: user.id,
      medication: form.medication,
      dose_mg: doseMg,
      change_date: today,
      change_type: "start",
    });

    setDone(true);
    setSaving(false);

    // Redirect to dashboard after brief pause
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100);
  const doses = getDoses();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px 48px",
      }}
    >
      {/* Logo */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#131413"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#1a1a1a" }}>
          MuscleGuard
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: 540 }}>
        {/* Progress bar */}
        {!done && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 13, color: "#666" }}>
                Step {step} of {TOTAL_STEPS}
              </span>
              <span style={{ fontSize: 13, color: "#666" }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(191,193,192,0.3)", borderRadius: 99 }}>
              <div
                style={{
                  height: 6,
                  background: "#131413",
                  borderRadius: 99,
                  width: `${progress}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 10,
            padding: "28px 24px",
          }}
        >
          {/* ── DONE SCREEN ── */}
          {done && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: 8,
                }}
              >
                Assessment complete
              </h2>
              <p
                style={{
                  color: "#666",
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Your personalized muscle preservation protocol is being
                generated:
              </p>
              <div
                style={{
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  "Protein target adjusted to your dose",
                  "Resistance plan to protect lean mass",
                  "Activity-specific training protocol",
                  "Body composition monitoring (not just weight)",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{ color: "#131413", fontWeight: 700, marginTop: 1 }}
                    >
                      ✓
                    </span>
                    <span style={{ fontSize: 14, color: "#1a1a1a" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <p
                style={{ fontSize: 12, color: "#999", marginTop: 20 }}
              >
                Redirecting in a moment…
              </p>
            </div>
          )}

          {/* ── STEP 1: Body & Goal ── */}
          {!done && step === 1 && (
            <div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Your body &amp; goal
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                This helps us calculate your personalized protein target.
              </p>

              {/* Weight input */}
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Current weight
              </label>
              <div
                style={{
                  position: "relative",
                  marginBottom: 24,
                  maxWidth: 160,
                }}
              >
                <input
                  type="number"
                  placeholder="e.g. 82"
                  value={form.weight_kg}
                  onChange={(e) => set("weight_kg", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.1)",
                    fontSize: 15,
                    color: "#1a1a1a",
                    background: "#fff",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 13,
                    color: "#999",
                    fontWeight: 600,
                  }}
                >
                  kg
                </span>
              </div>

              {/* Primary goal */}
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                What is your primary goal?
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  {
                    value: "preserve_muscle",
                    label: "Preserve muscle",
                    desc: "Maintain lean mass while losing weight on GLP-1",
                  },
                  {
                    value: "build_strength",
                    label: "Build strength",
                    desc: "Add muscle while managing weight",
                  },
                  {
                    value: "general_health",
                    label: "General health",
                    desc: "Stay active and feel better",
                  },
                ].map((opt) => {
                  const selected = form.primary_goal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("primary_goal", opt.value)}
                      style={{
                        textAlign: "left",
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: selected
                          ? "2px solid #131413"
                          : "1px solid rgba(0,0,0,0.1)",
                        background: selected ? "#f7f7f7" : "#fff",
                        color: "#1a1a1a",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: selected ? 700 : 600,
                          color: selected ? "#131413" : "#585A59",
                        }}
                      >
                        {opt.label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#666",
                          marginTop: 3,
                        }}
                      >
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
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Your GLP-1 medication
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                We use this to adjust your protein and training intensity.
              </p>

              {/* Medication type */}
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Medication type
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {[
                  {
                    value: "semaglutide",
                    label: "Semaglutide (Ozempic / Wegovy)",
                  },
                  {
                    value: "tirzepatide",
                    label: "Tirzepatide (Mounjaro / Zepbound)",
                  },
                  { value: "other", label: "Other GLP-1" },
                ].map((med) => (
                  <button
                    key={med.value}
                    type="button"
                    onClick={() => {
                      set("medication", med.value);
                      set("dose_mg", "");
                    }}
                    style={{
                      textAlign: "left",
                      padding: "11px 14px",
                      borderRadius: 8,
                      fontSize: 14,
                      border:
                        form.medication === med.value
                          ? "2px solid #131413"
                          : "1px solid rgba(0,0,0,0.1)",
                      background:
                        form.medication === med.value ? "#f7f7f7" : "#fff",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      fontWeight: form.medication === med.value ? 600 : 400,
                    }}
                  >
                    {med.label}
                  </button>
                ))}
              </div>

              {/* Dose */}
              {form.medication && (
                <>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1a1a1a",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Current dose
                  </label>
                  {form.medication === "other" ? (
                    <div
                      style={{
                        position: "relative",
                        marginBottom: 20,
                        maxWidth: 160,
                      }}
                    >
                      <input
                        type="number"
                        placeholder="e.g. 1.0"
                        value={form.dose_other}
                        onChange={(e) => set("dose_other", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 40px 10px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(0,0,0,0.1)",
                          fontSize: 15,
                          color: "#1a1a1a",
                          background: "#fff",
                          boxSizing: "border-box",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: 13,
                          color: "#999",
                          fontWeight: 600,
                        }}
                      >
                        mg
                      </span>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 20 }}>
                      <select
                        value={form.dose_mg}
                        onChange={(e) => set("dose_mg", e.target.value)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(0,0,0,0.1)",
                          fontSize: 14,
                          color: form.dose_mg ? "#1a1a1a" : "#999",
                          background: "#fff",
                          cursor: "pointer",
                          minWidth: 160,
                        }}
                      >
                        <option value="">Select dose…</option>
                        {doses.map((d) => (
                          <option key={d} value={String(d)}>
                            {d} mg
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Frequency */}
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Injection frequency
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                {[
                  { value: "weekly", label: "Weekly" },
                  { value: "biweekly", label: "Every 2 weeks" },
                  { value: "monthly", label: "Monthly" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      set("frequency", opt.value);
                      if (opt.value !== "weekly") set("injection_day", "");
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      border:
                        form.frequency === opt.value
                          ? "2px solid #131413"
                          : "1px solid rgba(0,0,0,0.1)",
                      background:
                        form.frequency === opt.value ? "#f7f7f7" : "#fff",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      fontWeight: form.frequency === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Injection day (weekly only) */}
              {form.frequency === "weekly" && (
                <>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1a1a1a",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Injection day
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: 6,
                      marginBottom: 20,
                    }}
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => set("injection_day", day)}
                        style={{
                          padding: "8px 4px",
                          borderRadius: 8,
                          fontSize: 12,
                          border:
                            form.injection_day === day
                              ? "2px solid #131413"
                              : "1px solid rgba(0,0,0,0.1)",
                          background:
                            form.injection_day === day ? "#f7f7f7" : "#fff",
                          color:
                            form.injection_day === day ? "#1b5e20" : "#1a1a1a",
                          cursor: "pointer",
                          fontWeight: form.injection_day === day ? 700 : 400,
                          textAlign: "center",
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Appetite */}
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Appetite suppression right now
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {APPETITE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("appetite_level", opt.value)}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      borderRadius: 8,
                      fontSize: 14,
                      border:
                        form.appetite_level === opt.value
                          ? "2px solid #131413"
                          : "1px solid rgba(0,0,0,0.1)",
                      background:
                        form.appetite_level === opt.value ? "#f7f7f7" : "#fff",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      fontWeight: form.appetite_level === opt.value ? 600 : 400,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Activity ── */}
          {!done && step === 3 && (
            <div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Your activity
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                Tell us about your exercise habits so we can build your training
                protocol.
              </p>

              {/* Activity types */}
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                What types of exercise do you do?{" "}
                <span style={{ color: "#666", fontWeight: 400 }}>
                  (select all that apply)
                </span>
              </label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {ACTIVITY_OPTIONS.map((opt) => {
                  const selected = form.activity_types.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleActivity(opt.value)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        fontSize: 13,
                        border: selected
                          ? "2px solid #131413"
                          : "1px solid rgba(0,0,0,0.1)",
                        background: selected ? "#f7f7f7" : "#fff",
                        color: selected ? "#131413" : "#585A59",
                        cursor: "pointer",
                        fontWeight: selected ? 600 : 400,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>{opt.emoji}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Primary activity (only if 2+ selected) */}
              {form.activity_types.length >= 2 && (
                <>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1a1a1a",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Which is your primary activity?
                  </label>
                  <div style={{ marginBottom: 20 }}>
                    <select
                      value={form.primary_activity}
                      onChange={(e) => set("primary_activity", e.target.value)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(0,0,0,0.1)",
                        fontSize: 14,
                        color: form.primary_activity ? "#1a1a1a" : "#999",
                        background: "#fff",
                        cursor: "pointer",
                        minWidth: 200,
                      }}
                    >
                      <option value="">Select primary activity…</option>
                      {form.activity_types.map((act) => {
                        const opt = ACTIVITY_OPTIONS.find(
                          (o) => o.value === act
                        );
                        return opt ? (
                          <option key={act} value={act}>
                            {opt.emoji} {opt.label}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>
                </>
              )}

              {/* Frequency */}
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                How often do you exercise?
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                {[
                  { value: "1_2x", label: "1-2x/week" },
                  { value: "3_4x", label: "3-4x/week" },
                  { value: "5x_plus", label: "5+x/week" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("activity_frequency", opt.value)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      border:
                        form.activity_frequency === opt.value
                          ? "2px solid #131413"
                          : "1px solid rgba(0,0,0,0.1)",
                      background:
                        form.activity_frequency === opt.value
                          ? "#f1f8f1"
                          : "#fff",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      fontWeight:
                        form.activity_frequency === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Experience */}
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Experience level
              </label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                {[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("experience_level", opt.value)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      border:
                        form.experience_level === opt.value
                          ? "2px solid #131413"
                          : "1px solid rgba(0,0,0,0.1)",
                      background:
                        form.experience_level === opt.value
                          ? "#f1f8f1"
                          : "#fff",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      fontWeight:
                        form.experience_level === opt.value ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Equipment (only if strength selected) */}
              {form.activity_types.includes("strength") && (
                <>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1a1a1a",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Equipment available
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {[
                      { value: "gym", label: "Full gym", emoji: "🏋️" },
                      {
                        value: "dumbbells",
                        label: "Dumbbells at home",
                        emoji: "💪",
                      },
                      {
                        value: "bodyweight",
                        label: "Bodyweight only",
                        emoji: "🤸",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set("equipment", opt.value)}
                        style={{
                          textAlign: "left",
                          padding: "10px 14px",
                          borderRadius: 8,
                          fontSize: 14,
                          border:
                            form.equipment === opt.value
                              ? "2px solid #131413"
                              : "1px solid rgba(0,0,0,0.1)",
                          background:
                            form.equipment === opt.value ? "#f7f7f7" : "#fff",
                          color: "#1a1a1a",
                          cursor: "pointer",
                          fontWeight: form.equipment === opt.value ? 600 : 400,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Field error */}
          {fieldError && !done && (
            <div
              style={{
                background: "#ffebee",
                border: "1px solid #f44336",
                borderRadius: 8,
                padding: "10px 14px",
                marginTop: 16,
              }}
            >
              <p style={{ fontSize: 13, color: "#c62828", margin: 0 }}>
                {fieldError}
              </p>
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
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    border: "1px solid rgba(0,0,0,0.1)",
                    background: "#fff",
                    color: "#1a1a1a",
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    border: "none",
                    background: "#131413",
                    color: "#fff",
                    cursor: "pointer",
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
                    flex: 1,
                    padding: "12px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    border: "none",
                    background: saving ? "#ccc" : "#131413",
                    color: "#fff",
                    cursor: saving ? "not-allowed" : "pointer",
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
