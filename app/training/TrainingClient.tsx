"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Flame, Trophy, AlertTriangle } from "lucide-react";
import { intensityInfo } from "@/lib/personalization";
import { getIntensityAdvice, type CommStyle } from "@/lib/comm-style";
import { getProtocol, COMPLEMENTARY_STRENGTH_SESSIONS, type WorkoutSession } from "@/lib/workout-protocols";

interface Props {
  weekKey: string;
  initialDone: string[];
  workoutStreakDays: number;
  proteinStreakDays: number;
  totalPoints: number;
  intensityPct: number;
  activityTypes: string[];
  primaryActivity: string;
  experienceLevel: string;
  equipment: string;
  commStyle: string;
}

export function TrainingClient({
  weekKey,
  initialDone,
  workoutStreakDays,
  proteinStreakDays,
  totalPoints,
  intensityPct,
  activityTypes,
  primaryActivity,
  experienceLevel: _experienceLevel,
  equipment: _equipment,
  commStyle,
}: Props) {
  const [done, setDone] = useState<string[]>(initialDone);
  const [streak, setStreak] = useState(workoutStreakDays);
  const [points, setPoints] = useState(totalPoints);
  const [toggling, setToggling] = useState<string | null>(null);

  const protocol = getProtocol(primaryActivity || "strength");
  const info = intensityInfo(intensityPct);

  const milestoneLabel =
    streak >= 30 ? "🏆 Iron Will, 30 workouts!" :
    streak >= 14 ? "⭐ Dedicated, 14 workouts!" :
    streak >= 7  ? "🎖 Consistent, 7 workouts!" : null;

  async function toggleDay(id: string) {
    setToggling(id);
    const action = done.includes(id) ? "uncomplete" : "complete";
    const res = await fetch("/api/workout-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workout_day: id, week_key: weekKey, action }),
    });
    const data = await res.json();

    if (action === "complete") {
      setDone((prev) => [...prev, id]);
      if (typeof data.streak === "number") setStreak(data.streak);
      setPoints((p) => p + 5);
    } else {
      setDone((prev) => prev.filter((d) => d !== id));
    }
    setToggling(null);
  }

  const trackedSessions = protocol.needsComplementaryStrength
    ? [...protocol.primarySessions, ...COMPLEMENTARY_STRENGTH_SESSIONS]
    : protocol.primarySessions;
  const trackedIds = trackedSessions.map((s) => s.id);
  const trackedDoneCount = done.filter((d) => trackedIds.includes(d)).length;

  // Intensity bar width
  const intensityBarColor =
    info.colorClass === "green"  ? "#CDFF00" :
    info.colorClass === "blue"   ? "#CDFF00" :
    info.colorClass === "amber"  ? "#FFB4AB" :
    "#FFB4AB";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

      {/* ── Hero Card (dark) ── */}
      <div className="bg-obsidian rounded-[14px] p-6 space-y-5">
        {/* Header row */}
        <div className="sm:flex sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {protocol.emoji} {protocol.displayName}
            </h1>
            <p className="text-white/50 mt-1 text-sm max-w-sm">
              {protocol.glp1Note}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-full">
              <span className="text-sm">{streak >= 7 ? "🔥🔥" : streak >= 1 ? "🔥" : "💤"}</span>
              <span className={`text-xs font-semibold ${streak >= 1 ? "text-white" : "text-white/40"}`}>
                {streak} workout{streak !== 1 ? "s" : ""}
              </span>
            </div>
            {proteinStreakDays >= 1 && (
              <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-full">
                <span className="text-xs">🥩</span>
                <span className="text-xs font-semibold text-white">
                  {proteinStreakDays}d protein
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Intensity bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">
              Training at {intensityPct}% intensity
            </p>
            <span className="text-xs text-white/50">{info.label}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${intensityPct}%`, backgroundColor: intensityBarColor }}
            />
          </div>
          <p className="text-xs text-white/50">
            {getIntensityAdvice(intensityPct, commStyle as CommStyle)}
          </p>
        </div>

        {/* Weekly progress */}
        <div className="flex gap-2 items-center pt-2 border-t border-white/5">
          <span className="text-sm text-white/40 mr-1">This week</span>
          {trackedSessions.map((session) => (
            <div
              key={session.id}
              className={`h-2.5 flex-1 rounded-full transition-colors ${done.includes(session.id) ? "bg-[#CDFF00]" : "bg-white/10"}`}
            />
          ))}
          <span className="text-sm font-semibold text-white ml-1">
            {trackedDoneCount}/{trackedSessions.length}
          </span>
          {trackedDoneCount === trackedSessions.length && trackedSessions.length > 0 && (
            <span className="text-sm">🏆</span>
          )}
        </div>

        {/* Points */}
        <div className="flex items-center gap-1.5 justify-center">
          <Flame className="h-3.5 w-3.5 text-white" />
          <span className="text-xs text-white font-medium">{points} total points · +5 per workout</span>
        </div>
      </div>

      {/* Milestone */}
      {milestoneLabel && (
        <div className="flex items-center gap-2 px-3 py-2 bg-obsidian rounded-lg">
          <Trophy className="h-4 w-4 text-[#CDFF00] flex-shrink-0" />
          <span className="text-sm font-medium text-white">{milestoneLabel}</span>
        </div>
      )}

      {/* ── Primary activity sessions ── */}
      {protocol.needsComplementaryStrength && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-medium text-obsidian mb-1">
              {protocol.emoji} {protocol.displayName} Sessions
            </h2>
            <p className="text-xs text-mgray">Mark each session when you complete it.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {protocol.primarySessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isDone={done.includes(session.id)}
                toggling={toggling === session.id}
                onToggle={() => toggleDay(session.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Strength protocol (for primary=strength) ── */}
      {!protocol.needsComplementaryStrength && primaryActivity === "strength" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {protocol.primarySessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isDone={done.includes(session.id)}
              toggling={toggling === session.id}
              onToggle={() => toggleDay(session.id)}
            />
          ))}
        </div>
      )}

      {/* ── HIIT sessions (no complementary needed) ── */}
      {!protocol.needsComplementaryStrength && primaryActivity !== "strength" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {protocol.primarySessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isDone={done.includes(session.id)}
              toggling={toggling === session.id}
              onToggle={() => toggleDay(session.id)}
            />
          ))}
        </div>
      )}

      {/* ── Complementary strength (for non-strength primary) ── */}
      {protocol.needsComplementaryStrength && (
        <div className="space-y-4">
          {/* GLP-1 warning */}
          <div className="flex items-start gap-3 p-4 bg-obsidian rounded-[10px]">
            <AlertTriangle className="h-5 w-5 text-[#FFB4AB] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-[#FFB4AB] text-sm">
                Muscle Preservation Required on GLP-1
              </p>
              <p className="text-xs text-white mt-1">{protocol.glp1Note}</p>
            </div>
          </div>

          <div>
            <h2 className="text-base font-medium text-obsidian mb-1">
              💪 Complementary Strength Sessions
            </h2>
            <p className="text-xs text-mgray mb-3">
              Complete 2x/week to prevent muscle loss on GLP-1.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {COMPLEMENTARY_STRENGTH_SESSIONS.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isDone={done.includes(session.id)}
                toggling={toggling === session.id}
                onToggle={() => toggleDay(session.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: WorkoutSession;
  isDone: boolean;
  toggling: boolean;
  onToggle: () => void;
}

function SessionCard({ session, isDone, toggling, onToggle }: SessionCardProps) {
  return (
    <div className={`bg-white border border-black/5 rounded-[10px] flex flex-col ${isDone ? "opacity-70" : ""}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-obsidian">{session.label}</h3>
          <span className="text-xs text-muted shrink-0 px-2 py-0.5 bg-surface rounded">
            ~{session.duration}
          </span>
        </div>
        <p className="text-xs text-mgray mt-1">{session.description}</p>
      </div>

      {/* Exercises */}
      {session.exercises && session.exercises.length > 0 && (
        <div className="px-5 pb-3 flex-1">
          <div className="divide-y divide-black/5">
            {session.exercises.map((ex) => (
              <div key={ex.name} className="py-2 flex justify-between items-start gap-2">
                <div>
                  <p className="text-sm font-medium text-obsidian">{ex.name}</p>
                  <p className="text-[11px] text-muted">{ex.why}</p>
                </div>
                <span className="text-xs text-mgray shrink-0 font-medium bg-surface px-1.5 py-0.5 rounded">
                  {ex.sets}×{ex.reps}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action button */}
      <div className="px-5 pb-5 mt-auto">
        <button
          onClick={onToggle}
          disabled={toggling}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
            isDone
              ? "bg-surface text-mgray"
              : "bg-obsidian text-white hover:bg-obsidian-light"
          }`}
        >
          {toggling ? (
            "Saving…"
          ) : isDone ? (
            <><CheckCircle2 className="h-4 w-4" /> Done this week</>
          ) : (
            <><Circle className="h-4 w-4" /> Mark as done (+5 pts)</>
          )}
        </button>
      </div>
    </div>
  );
}
