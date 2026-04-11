"use client";

import { useState } from "react";
import { SEMAGLUTIDE_DOSES, TIRZEPATIDE_DOSES } from "@/lib/personalization";

interface MedLog {
  id: string;
  medication: string;
  dose_mg: number;
  change_date: string;
  change_type: string;
  previous_dose_mg: number | null;
  appetite_level: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  userId: string;
  medication: string;
  doseMg: number;
  frequency: string;
  injectionDay: string | null;
  lastDoseDate: string | null;
  nextDueDate: string | null;
  status: "on_schedule" | "due_today" | "active" | "critical";
  statusLabel: string;
  statusColorClass: string;
  daysUntil: number;
  logs: MedLog[];
  currentProteinGoal: number;
  currentIntensityPct: number;
}

const APPETITE_OPTIONS = [
  { value: "none", label: "No suppression" },
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
  { value: "very_severe", label: "Very severe" },
];

const CHANGE_TYPES = [
  { value: "increase", label: "Dose increase" },
  { value: "decrease", label: "Dose decrease" },
  { value: "switch", label: "Switch medication" },
  { value: "pause", label: "Pause medication" },
];

const CHANGE_TYPE_COLORS: Record<string, string> = {
  start: "#2196f3",
  increase: "#4caf50",
  decrease: "#ff9800",
  switch: "#9c27b0",
  pause: "#f44336",
  dose_taken: "#9e9e9e",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMedLabel(med: string) {
  if (med === "semaglutide") return "Semaglutide";
  if (med === "tirzepatide") return "Tirzepatide";
  return med.charAt(0).toUpperCase() + med.slice(1);
}

export function MedicationClient({
  userId: _userId,
  medication,
  doseMg,
  frequency,
  injectionDay,
  nextDueDate,
  status,
  statusLabel,
  statusColorClass,
  logs: initialLogs,
  currentProteinGoal,
  currentIntensityPct,
}: Props) {
  const [logs, setLogs] = useState<MedLog[]>(initialLogs);
  const [logTakenLoading, setLogTakenLoading] = useState(false);
  const [logTakenSuccess, setLogTakenSuccess] = useState(false);
  const [showDoseForm, setShowDoseForm] = useState(false);
  const [doseFormLoading, setDoseFormLoading] = useState(false);
  const [doseFormSuccess, setDoseFormSuccess] = useState<{
    proteinGoal: number;
    intensityPct: number;
  } | null>(null);

  // Dose change form state
  const [newDose, setNewDose] = useState("");
  const [changeType, setChangeType] = useState("increase");
  const [formAppetite, setFormAppetite] = useState("moderate");
  const [energyLevel, setEnergyLevel] = useState("moderate");
  const [notes, setNotes] = useState("");

  const statusBadgeStyle = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    background:
      statusColorClass === "green"  ? "#f1f8f1" :
      statusColorClass === "amber"  ? "#fffbeb" :
      statusColorClass === "orange" ? "#fff7ed" :
      "#fff0f0",
    color:
      statusColorClass === "green"  ? "#2e7d32" :
      statusColorClass === "amber"  ? "#92400e" :
      statusColorClass === "orange" ? "#c2410c" :
      "#b91c1c",
    border: `1px solid ${
      statusColorClass === "green"  ? "#bbf7d0" :
      statusColorClass === "amber"  ? "#fde68a" :
      statusColorClass === "orange" ? "#fed7aa" :
      "#fecaca"
    }`,
  };

  function getDosesForMed() {
    if (medication === "semaglutide") return SEMAGLUTIDE_DOSES;
    if (medication === "tirzepatide") return TIRZEPATIDE_DOSES;
    return [];
  }

  async function handleLogTaken() {
    setLogTakenLoading(true);
    try {
      const res = await fetch("/api/medication/log-taken", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setLogTakenSuccess(true);
        // Add a new log entry at the top
        setLogs((prev) => [
          {
            id: String(Date.now()),
            medication,
            dose_mg: doseMg,
            change_date: new Date().toISOString().split("T")[0],
            change_type: "dose_taken",
            previous_dose_mg: null,
            appetite_level: null,
            notes: null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setTimeout(() => setLogTakenSuccess(false), 4000);
      }
    } catch {
      // ignore
    } finally {
      setLogTakenLoading(false);
    }
  }

  async function handleDoseChange(e: React.FormEvent) {
    e.preventDefault();
    setDoseFormLoading(true);
    try {
      const res = await fetch("/api/medication/log-dose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dose_mg: parseFloat(newDose),
          change_type: changeType,
          appetite_level: formAppetite,
          energy_level: energyLevel,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setDoseFormSuccess({
          proteinGoal: data.newProteinGoal,
          intensityPct: data.newIntensityPct,
        });
        setLogs((prev) => [
          {
            id: String(Date.now()),
            medication,
            dose_mg: parseFloat(newDose),
            change_date: new Date().toISOString().split("T")[0],
            change_type: changeType,
            previous_dose_mg: doseMg,
            appetite_level: formAppetite,
            notes: notes || null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setTimeout(() => {
          setShowDoseForm(false);
          setDoseFormSuccess(null);
          setNewDose("");
          setNotes("");
        }, 4000);
      }
    } catch {
      // ignore
    } finally {
      setDoseFormLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 540,
        margin: "0 auto",
        padding: "32px 16px 48px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: 20,
        }}
      >
        Medication
      </h1>

      {/* ── Status Card ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: "20px 20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div>
            <p
              style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: 0 }}
            >
              {doseMg}mg {getMedLabel(medication)}
            </p>
            <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0" }}>
              {frequency === "weekly"
                ? `Every week${injectionDay ? ` on ${injectionDay}` : ""}`
                : frequency === "biweekly"
                ? "Every 2 weeks"
                : "Monthly"}
            </p>
          </div>
          <span style={statusBadgeStyle}>{status === "on_schedule" ? "On schedule" : statusLabel}</span>
        </div>

        {nextDueDate && (
          <p style={{ fontSize: 13, color: "#444", marginBottom: 16 }}>
            <span style={{ fontWeight: 600 }}>Next dose:</span>{" "}
            {formatDate(nextDueDate)} —{" "}
            <span
              style={{
                color:
                  statusColorClass === "green"
                    ? "#2e7d32"
                    : statusColorClass === "amber"
                    ? "#92400e"
                    : "#c2410c",
                fontWeight: 600,
              }}
            >
              {statusLabel}
            </span>
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={handleLogTaken}
            disabled={logTakenLoading || logTakenSuccess}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              background: logTakenSuccess ? "#4caf50" : "#2e7d32",
              color: "#fff",
              cursor: logTakenLoading || logTakenSuccess ? "default" : "pointer",
            }}
          >
            {logTakenSuccess ? "✓ Logged!" : logTakenLoading ? "Logging…" : "✓ Log dose taken today"}
          </button>
          <button
            type="button"
            onClick={() => setShowDoseForm(!showDoseForm)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid #ddd",
              background: "#fff",
              color: "#1a1a1a",
              cursor: "pointer",
            }}
          >
            ↑ Log dose change
          </button>
        </div>
      </div>

      {/* ── Dose change form (inline) ── */}
      {showDoseForm && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: "20px",
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: 16,
            }}
          >
            Log dose change
          </h3>

          {doseFormSuccess ? (
            <div
              style={{
                background: "#f1f8f1",
                border: "1px solid #c8e6c9",
                borderRadius: 8,
                padding: "12px 16px",
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 600, color: "#2e7d32", margin: 0 }}>
                ✓ Plan updated!
              </p>
              <p style={{ fontSize: 13, color: "#444", margin: "6px 0 0" }}>
                New protein target: <strong>{doseFormSuccess.proteinGoal}g/day</strong>
                {" · "}Training intensity: <strong>{doseFormSuccess.intensityPct}%</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleDoseChange} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* New dose */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  New dose
                </label>
                {getDosesForMed().length > 0 ? (
                  <select
                    value={newDose}
                    onChange={(e) => setNewDose(e.target.value)}
                    required
                    style={{
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      fontSize: 14,
                      color: newDose ? "#1a1a1a" : "#999",
                      background: "#fff",
                      minWidth: 140,
                    }}
                  >
                    <option value="">Select dose…</option>
                    {getDosesForMed().map((d) => (
                      <option key={d} value={String(d)}>
                        {d} mg
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    placeholder="e.g. 1.0"
                    value={newDose}
                    onChange={(e) => setNewDose(e.target.value)}
                    required
                    style={{
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      fontSize: 14,
                      width: 100,
                    }}
                  />
                )}
              </div>

              {/* Change type */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Type of change
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {CHANGE_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => setChangeType(ct.value)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 8,
                        fontSize: 13,
                        border:
                          changeType === ct.value
                            ? "2px solid #2e7d32"
                            : "1px solid #ddd",
                        background:
                          changeType === ct.value ? "#f1f8f1" : "#fff",
                        color: "#1a1a1a",
                        cursor: "pointer",
                        fontWeight: changeType === ct.value ? 600 : 400,
                      }}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Appetite */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Current appetite
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {APPETITE_OPTIONS.map((ao) => (
                    <button
                      key={ao.value}
                      type="button"
                      onClick={() => setFormAppetite(ao.value)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        border:
                          formAppetite === ao.value
                            ? "2px solid #2e7d32"
                            : "1px solid #ddd",
                        background:
                          formAppetite === ao.value ? "#f1f8f1" : "#fff",
                        color: "#1a1a1a",
                        cursor: "pointer",
                        fontWeight: formAppetite === ao.value ? 600 : 400,
                      }}
                    >
                      {ao.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Current energy level
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {["low", "moderate", "high"].map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEnergyLevel(e)}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        border:
                          energyLevel === e
                            ? "2px solid #2e7d32"
                            : "1px solid #ddd",
                        background: energyLevel === e ? "#f1f8f1" : "#fff",
                        color: "#1a1a1a",
                        cursor: "pointer",
                        fontWeight: energyLevel === e ? 600 : 400,
                        textTransform: "capitalize",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any relevant notes…"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    fontSize: 13,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={doseFormLoading || !newDose}
                style={{
                  padding: "11px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  border: "none",
                  background:
                    doseFormLoading || !newDose ? "#ccc" : "#2e7d32",
                  color: "#fff",
                  cursor:
                    doseFormLoading || !newDose ? "not-allowed" : "pointer",
                }}
              >
                {doseFormLoading ? "Saving…" : "Save dose change"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Your Plan ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: 12,
          }}
        >
          Your current plan
        </h3>
        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              flex: 1,
              background: "#f9fafb",
              borderRadius: 8,
              padding: "12px",
            }}
          >
            <p style={{ fontSize: 11, color: "#666", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Protein goal
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#2e7d32", margin: "4px 0 2px" }}>
              {currentProteinGoal}g
            </p>
            <p style={{ fontSize: 11, color: "#999", margin: 0 }}>per day</p>
          </div>
          <div
            style={{
              flex: 1,
              background: "#f9fafb",
              borderRadius: 8,
              padding: "12px",
            }}
          >
            <p style={{ fontSize: 11, color: "#666", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Training intensity
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                color:
                  currentIntensityPct >= 95
                    ? "#2e7d32"
                    : currentIntensityPct >= 85
                    ? "#1d4ed8"
                    : currentIntensityPct >= 75
                    ? "#92400e"
                    : "#c2410c",
                margin: "4px 0 2px",
              }}
            >
              {currentIntensityPct}%
            </p>
            <p style={{ fontSize: 11, color: "#999", margin: 0 }}>
              {currentIntensityPct >= 95
                ? "Full intensity"
                : currentIntensityPct >= 85
                ? "Moderate"
                : currentIntensityPct >= 75
                ? "Reduced"
                : "Light"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Dose History ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: 14,
          }}
        >
          Dose history
        </h3>

        {logs.length === 0 ? (
          <p style={{ fontSize: 13, color: "#999", textAlign: "center", padding: "16px 0" }}>
            No medication logs yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {logs.map((log, i) => (
              <div
                key={log.id}
                style={{
                  paddingTop: i > 0 ? 12 : 0,
                  paddingBottom: i < logs.length - 1 ? 12 : 0,
                  borderBottom: i < logs.length - 1 ? "1px solid #f0f0f0" : "none",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: CHANGE_TYPE_COLORS[log.change_type] ?? "#9e9e9e",
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: `${CHANGE_TYPE_COLORS[log.change_type]}22`,
                        color: CHANGE_TYPE_COLORS[log.change_type] ?? "#666",
                      }}
                    >
                      {log.change_type.replace("_", " ")}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
                      {log.dose_mg}mg
                    </span>
                    <span style={{ fontSize: 12, color: "#999" }}>
                      {formatDate(log.change_date)}
                    </span>
                  </div>
                  {log.appetite_level && (
                    <p style={{ fontSize: 12, color: "#666", margin: "3px 0 0" }}>
                      Appetite: {log.appetite_level.replace("_", " ")}
                    </p>
                  )}
                  {log.notes && (
                    <p style={{ fontSize: 12, color: "#888", margin: "3px 0 0", fontStyle: "italic" }}>
                      {log.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
