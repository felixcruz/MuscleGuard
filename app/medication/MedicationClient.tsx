"use client";

import { useState } from "react";
import { Pill, Check, ChevronDown, ChevronRight } from "lucide-react";
import { SEMAGLUTIDE_DOSES, TIRZEPATIDE_DOSES, getNextDueDate, getMedicationStatus } from "@/lib/personalization";

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
  const [lastDoseDate, setLastDoseDate] = useState<string | null>(nextDueDate ? null : null);
  const [currentStatus, setCurrentStatus] = useState({ status, statusLabel, statusColorClass, nextDueDate });
  const [logTakenLoading, setLogTakenLoading] = useState(false);
  const [logTakenSuccess, setLogTakenSuccess] = useState(false);
  const [showDoseForm, setShowDoseForm] = useState(false);
  const [doseFormLoading, setDoseFormLoading] = useState(false);
  const [doseFormSuccess, setDoseFormSuccess] = useState<{
    proteinGoal: number;
    intensityPct: number;
  } | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const [newDose, setNewDose] = useState("");
  const [changeType, setChangeType] = useState("increase");
  const [formAppetite, setFormAppetite] = useState("moderate");
  const [energyLevel, setEnergyLevel] = useState("moderate");
  const [notes, setNotes] = useState("");

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
        const today = new Date().toISOString().split("T")[0];
        setLogs((prev) => [
          {
            id: String(Date.now()),
            medication,
            dose_mg: doseMg,
            change_date: today,
            change_type: "dose_taken",
            previous_dose_mg: null,
            appetite_level: null,
            notes: null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        // Recalculate status
        const newNextDue = getNextDueDate(today, frequency);
        const newStatus = getMedicationStatus(newNextDue);
        setCurrentStatus({
          status: newStatus.status,
          statusLabel: newStatus.label,
          statusColorClass: newStatus.colorClass,
          nextDueDate: newNextDue ? newNextDue.toISOString().split("T")[0] : null,
        });
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

  const frequencyLabel =
    frequency === "weekly"
      ? `Every week${injectionDay ? `, ${injectionDay}` : ""}`
      : frequency === "biweekly"
      ? "Every 2 weeks"
      : "Monthly";

  const statusBg =
    currentStatus.statusColorClass === "green" ? "bg-[#CDFF00]" :
    currentStatus.statusColorClass === "amber" ? "bg-[#FFB4AB]" :
    "bg-[#FFB4AB]";
  const statusTextColor = "text-obsidian";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

      {/* ── Hero Card (dark) ── */}
      <div className="bg-obsidian rounded-[14px] p-6">
        <div className="sm:flex sm:items-start sm:justify-between sm:gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-[#CDFF00]" />
              <h1 className="text-2xl font-bold text-white">Medication</h1>
            </div>
            <p className="text-xl font-medium text-white mt-2">
              {doseMg}mg {getMedLabel(medication)}
            </p>
            <p className="text-sm text-white/50">{frequencyLabel}</p>
          </div>

          <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBg} ${statusTextColor}`}>
              {currentStatus.status === "on_schedule" ? "On schedule" : currentStatus.statusLabel}
            </span>
            {currentStatus.nextDueDate && (
              <p className="text-xs text-white/50">
                Next dose: {formatDate(currentStatus.nextDueDate)}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleLogTaken}
            disabled={logTakenLoading || logTakenSuccess}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              logTakenSuccess
                ? "bg-[#CDFF00] text-obsidian"
                : "bg-white text-obsidian hover:bg-white/90"
            } disabled:opacity-70`}
          >
            {logTakenSuccess ? "✓ Logged!" : logTakenLoading ? "Logging…" : "✓ Log dose taken today"}
          </button>
          <button
            type="button"
            onClick={() => setShowDoseForm(!showDoseForm)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/10 transition-colors"
          >
            Log dose change
          </button>
        </div>
      </div>

      {/* ── Dose change form ── */}
      {showDoseForm && (
        <div className="bg-white border border-black/5 rounded-[10px] p-5">
          <h3 className="text-sm font-medium text-obsidian mb-4">Log dose change</h3>

          {doseFormSuccess ? (
            <div className="bg-obsidian rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-[#CDFF00] flex items-center justify-center">
                  <Check className="h-3 w-3 text-obsidian" />
                </div>
                <span className="text-sm font-medium text-white">Plan updated!</span>
              </div>
              <p className="text-xs text-white/60">
                New protein target: <span className="text-white font-medium">{doseFormSuccess.proteinGoal}g/day</span>
                {" · "}Training intensity: <span className="text-white font-medium">{doseFormSuccess.intensityPct}%</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleDoseChange} className="space-y-4">
              {/* New dose */}
              <div>
                <label className="text-xs font-medium text-mgray block mb-1.5">New dose</label>
                {getDosesForMed().length > 0 ? (
                  <select
                    value={newDose}
                    onChange={(e) => setNewDose(e.target.value)}
                    required
                    className="px-3 py-2 border border-black/10 rounded-lg text-sm bg-white min-w-[140px] focus:outline-none focus:ring-2 focus:ring-obsidian/20"
                  >
                    <option value="">Select dose…</option>
                    {getDosesForMed().map((d) => (
                      <option key={d} value={String(d)}>{d} mg</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    placeholder="e.g. 1.0"
                    value={newDose}
                    onChange={(e) => setNewDose(e.target.value)}
                    required
                    className="w-24 px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-obsidian/20"
                  />
                )}
              </div>

              {/* Change type */}
              <div>
                <label className="text-xs font-medium text-mgray block mb-1.5">Type of change</label>
                <div className="flex flex-wrap gap-2">
                  {CHANGE_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => setChangeType(ct.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        changeType === ct.value
                          ? "border-obsidian bg-surface text-obsidian font-medium"
                          : "border-black/5 bg-white text-mgray hover:border-black/10"
                      }`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Appetite */}
              <div>
                <label className="text-xs font-medium text-mgray block mb-1.5">Current appetite</label>
                <div className="flex flex-wrap gap-2">
                  {APPETITE_OPTIONS.map((ao) => (
                    <button
                      key={ao.value}
                      type="button"
                      onClick={() => setFormAppetite(ao.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        formAppetite === ao.value
                          ? "border-obsidian bg-surface text-obsidian font-medium"
                          : "border-black/5 bg-white text-mgray hover:border-black/10"
                      }`}
                    >
                      {ao.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div>
                <label className="text-xs font-medium text-mgray block mb-1.5">Current energy level</label>
                <div className="flex gap-2">
                  {["low", "moderate", "high"].map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEnergyLevel(e)}
                      className={`px-3 py-1.5 rounded-lg text-xs border capitalize transition-colors ${
                        energyLevel === e
                          ? "border-obsidian bg-surface text-obsidian font-medium"
                          : "border-black/5 bg-white text-mgray hover:border-black/10"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-mgray block mb-1.5">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any relevant notes…"
                  rows={2}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-obsidian/20"
                />
              </div>

              <button
                type="submit"
                disabled={doseFormLoading || !newDose}
                className="w-full py-2.5 bg-obsidian text-white text-sm font-medium rounded-lg hover:bg-obsidian-light transition-colors disabled:opacity-50"
              >
                {doseFormLoading ? "Saving…" : "Save dose change"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Your Plan ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-black/5 rounded-[10px] p-5 text-center">
          <p className="text-[10px] font-medium text-mgray uppercase tracking-widest mb-2">Protein goal</p>
          <p className="text-3xl font-bold text-obsidian">
            {currentProteinGoal}g
          </p>
          <p className="text-xs text-mgray mt-1">per day</p>
        </div>
        <div className="bg-white border border-black/5 rounded-[10px] p-5 text-center">
          <p className="text-[10px] font-medium text-mgray uppercase tracking-widest mb-2">Training intensity</p>
          <p className="text-3xl font-bold text-obsidian">
            {currentIntensityPct}%
          </p>
          <p className="text-xs text-mgray mt-1">
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

      {/* ── Dose History ── */}
      <div className="bg-white border border-black/5 rounded-[10px] overflow-hidden">
        <button
          type="button"
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors"
        >
          <span className="text-sm font-medium text-obsidian">Dose history</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-mgray">{logs.length} entries</span>
            {historyExpanded
              ? <ChevronDown className="h-4 w-4 text-muted" />
              : <ChevronRight className="h-4 w-4 text-muted" />
            }
          </div>
        </button>

        {historyExpanded && (
          <div className="border-t border-black/5">
            {logs.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">
                No medication logs yet.
              </p>
            ) : (
              <div className="divide-y divide-black/5">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                    {/* Timeline dot */}
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      log.change_type === "dose_taken" ? "bg-muted" :
                      log.change_type === "increase" ? "bg-[#CDFF00]" :
                      log.change_type === "decrease" ? "bg-[#FFB4AB]" :
                      log.change_type === "start" ? "bg-obsidian" :
                      log.change_type === "switch" ? "bg-obsidian" :
                      "bg-[#FFB4AB]"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                          log.change_type === "dose_taken" ? "bg-surface text-mgray" :
                          log.change_type === "increase" ? "bg-[#CDFF00]/10 text-obsidian" :
                          log.change_type === "decrease" ? "bg-[#FFB4AB]/10 text-obsidian" :
                          "bg-surface text-obsidian"
                        }`}>
                          {log.change_type.replace("_", " ")}
                        </span>
                        <span className="text-sm font-medium text-obsidian">{log.dose_mg}mg</span>
                        <span className="text-xs text-muted">{formatDate(log.change_date)}</span>
                      </div>
                      {log.appetite_level && (
                        <p className="text-xs text-mgray mt-1">
                          Appetite: {log.appetite_level.replace("_", " ")}
                        </p>
                      )}
                      {log.notes && (
                        <p className="text-xs text-muted mt-0.5 italic">{log.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
