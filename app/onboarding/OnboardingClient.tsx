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
  { value: "other", label: "Otro GLP-1" },
];

const DIET_PREFS = [
  { value: "omnivore", label: "Omnívoro" },
  { value: "vegetarian", label: "Vegetariano" },
  { value: "vegan", label: "Vegano" },
  { value: "gluten_free", label: "Sin gluten" },
  { value: "lactose_free", label: "Sin lácteos" },
  { value: "low_sodium", label: "Bajo en sodio" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentario", desc: "Trabajo de escritorio, <3,000 pasos/día" },
  { value: "light", label: "Ligera", desc: "Caminatas regulares, 5,000–8,000 pasos/día" },
  { value: "moderate", label: "Moderada", desc: "Entrenamiento 2–3 veces/semana" },
  { value: "intense", label: "Intensa", desc: "Fuerza 4+ veces/semana o deportes" },
];

const BOWEL_PATTERNS = [
  { value: "daily", label: "Diario" },
  { value: "every2to3days", label: "Cada 2–3 días" },
  { value: "lessThan2xWeek", label: "Menos de 2x/semana" },
];

const ALCOHOL_OPTIONS = [
  { value: "none", label: "No consumo" },
  { value: "occasional", label: "Ocasional" },
  { value: "regular", label: "Regular" },
  { value: "frequent", label: "Frecuente" },
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
      setFieldError("Por favor, completa todas las preguntas antes de continuar.");
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
      setFieldError("Por favor, completa todas las preguntas antes de continuar.");
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
              <span style={{ fontSize: 13, color: "#666" }}>Paso {step} de {TOTAL_STEPS}</span>
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
                Evaluación completada
              </h2>
              <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
                Tu protocolo personalizado de preservación muscular está siendo generado:
              </p>
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Cálculo de proteína ajustado a tu dosis (1.2–1.6 g/kg)",
                  "Plan de resistencia para proteger masa magra",
                  "Estrategia de hidratación y fibra para GLP-1",
                  "Monitoreo de composición corporal (no solo peso)",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ color: "#2e7d32", fontWeight: 700, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 14, color: "#1a1a1a" }}>{item}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "#999", marginTop: 20 }}>Redirigiendo en un momento…</p>
            </div>
          )}

          {/* ── STEP 1: Medicación + Tiroides ── */}
          {!done && step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                Tu medicación GLP-1
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                Esta información nos permite ajustar tu protocolo de preservación muscular.
              </p>

              <div style={{ background: "#e3f2fd", border: "1px solid #2196f3", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: "#1565c0", margin: 0 }}>
                  <strong>MuscleGuard</strong> no es un servicio médico. Esta app complementa — no reemplaza — la supervisión de tu médico.
                </p>
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "block", marginBottom: 8 }}>
                ¿Qué medicamento usas?
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
                ¿Tienes historial personal o familiar de cáncer de tiroides o síndrome MEN-2?
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ value: "no", label: "No" }, { value: "yes", label: "Sí" }].map((opt) => (
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
                    ⚠ MuscleGuard no puede ser utilizado con historial de cáncer de tiroides o MEN-2.
                  </p>
                  <p style={{ fontSize: 13, color: "#c62828", margin: "6px 0 0" }}>
                    Los GLP-1 están contraindicados en estas condiciones. Consulta a tu médico antes de continuar.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Preferencias dietéticas ── */}
          {!done && step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                Preferencias alimentarias
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                Selecciona todas las que apliquen. Las usaremos para personalizar tus recomendaciones de comidas.
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
                Biometría base
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                Necesitamos estos datos para calcular tu meta de proteína personalizada.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { field: "age" as keyof Form, label: "Edad", placeholder: "ej. 38", unit: "años", type: "number" },
                  { field: "weightKg" as keyof Form, label: "Peso", placeholder: "ej. 82", unit: "kg", type: "number" },
                  { field: "heightCm" as keyof Form, label: "Estatura", placeholder: "ej. 170", unit: "cm", type: "number" },
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
                Sexo biológico
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[
                  { value: "male", label: "Masculino" },
                  { value: "female", label: "Femenino" },
                  { value: "other", label: "Otro" },
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
                Nivel de actividad física
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
                Salud gastrointestinal
              </h2>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                Los GLP-1 afectan directamente el tránsito intestinal. Esta información nos ayuda a personalizar tu plan.
              </p>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", display: "block", marginBottom: 8 }}>
                ¿Con qué frecuencia vas al baño?
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
                Consumo de alcohol
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
                    ⚠ Alcohol + GLP-1 = riesgo de pancreatitis y deshidratación
                  </p>
                  <p style={{ fontSize: 13, color: "#856404", margin: "6px 0 0" }}>
                    La combinación puede intensificar los efectos secundarios. Tu plan incluirá estrategias de hidratación reforzadas.
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
                  ← Atrás
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
                  Siguiente →
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
                  {saving ? "Guardando…" : "Completar →"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
