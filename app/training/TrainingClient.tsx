"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Flame, Trophy, AlertTriangle } from "lucide-react";
import { intensityInfo } from "@/lib/personalization";
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
}: Props) {
  const [done, setDone] = useState<string[]>(initialDone);
  const [streak, setStreak] = useState(workoutStreakDays);
  const [points, setPoints] = useState(totalPoints);
  const [toggling, setToggling] = useState<string | null>(null);

  const protocol = getProtocol(primaryActivity || "strength");
  const info = intensityInfo(intensityPct);

  const milestoneLabel =
    streak >= 30 ? "🏆 Iron Will — 30 workouts!" :
    streak >= 14 ? "⭐ Dedicated — 14 workouts!" :
    streak >= 7  ? "🎖 Consistent — 7 workouts!" : null;

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

  // Strength sessions to show in the weekly progress bar
  const strengthSessions =
    protocol.needsComplementaryStrength
      ? COMPLEMENTARY_STRENGTH_SESSIONS
      : protocol.primarySessions;
  const strengthIds = strengthSessions.map((s) => s.id);
  const strengthDoneCount = done.filter((d) => strengthIds.includes(d)).length;

  // Intensity banner colors
  const intensityBg =
    info.colorClass === "green"  ? "#f0fdf4" :
    info.colorClass === "blue"   ? "#eff6ff" :
    info.colorClass === "amber"  ? "#fffbeb" :
    "#fff7ed";
  const intensityBorder =
    info.colorClass === "green"  ? "#bbf7d0" :
    info.colorClass === "blue"   ? "#bfdbfe" :
    info.colorClass === "amber"  ? "#fde68a" :
    "#fed7aa";
  const intensityText =
    info.colorClass === "green"  ? "#15803d" :
    info.colorClass === "blue"   ? "#1d4ed8" :
    info.colorClass === "amber"  ? "#92400e" :
    "#c2410c";

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

      {/* ── Intensity banner ── */}
      <div style={{
        padding: "12px 16px",
        borderRadius: 10,
        background: intensityBg,
        border: `1px solid ${intensityBorder}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: intensityText, margin: 0 }}>
            Training at {intensityPct}% intensity today — {info.label}
          </p>
          <p style={{ fontSize: 12, color: intensityText, margin: "3px 0 0", opacity: 0.85 }}>
            {info.advice}
          </p>
        </div>
      </div>

      {/* ── Header + streak badges ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {protocol.emoji} {protocol.displayName}
          </h1>
          <p className="text-gray-500 mt-1 text-sm max-w-xs">
            {protocol.glp1Note}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {/* Workout streak */}
          <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border flex-shrink-0 ${
            streak >= 1 ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-200"
          }`}>
            <span className="text-sm">{streak >= 7 ? "🔥🔥" : streak >= 1 ? "🔥" : "💤"}</span>
            <span className={`text-xs font-semibold ${streak >= 1 ? "text-orange-700" : "text-gray-400"}`}>
              {streak} workout{streak !== 1 ? "s" : ""}
            </span>
          </div>
          {/* Protein streak (cross-context) */}
          {proteinStreakDays >= 1 && (
            <div className="flex items-center gap-1 bg-green-50 border border-green-100 px-2.5 py-1.5 rounded-full">
              <span className="text-xs">🥩</span>
              <span className="text-xs font-semibold text-green-700">
                {proteinStreakDays}d protein
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Milestone */}
      {milestoneLabel && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Trophy className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <span className="text-sm font-medium text-yellow-800">{milestoneLabel}</span>
        </div>
      )}

      {/* Weekly progress */}
      <div className="flex gap-2 items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
        <span className="text-sm text-gray-500 mr-1">This week</span>
        {strengthSessions.map((session) => (
          <div
            key={session.id}
            className={`h-2.5 flex-1 rounded-full transition-colors ${done.includes(session.id) ? "bg-green-500" : "bg-gray-200"}`}
          />
        ))}
        <span className="text-sm font-semibold text-green-700 ml-1">
          {strengthDoneCount}/{strengthSessions.length}
        </span>
        {strengthDoneCount === strengthSessions.length && strengthSessions.length > 0 && (
          <span className="text-sm">🏆</span>
        )}
      </div>

      {/* Points */}
      <div className="flex items-center gap-1.5 justify-center">
        <Flame className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-xs text-gray-400 font-medium">{points} total points · +5 per workout</span>
      </div>

      {/* ── Primary activity sessions ── */}
      {protocol.needsComplementaryStrength && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              {protocol.emoji} {protocol.displayName} Sessions
            </h2>
            <p className="text-xs text-gray-500">Log your sessions to track your activity.</p>
          </div>
          {protocol.primarySessions.map((session) => (
            <PrimarySessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {/* ── Strength protocol (for primary=strength) ── */}
      {!protocol.needsComplementaryStrength && primaryActivity === "strength" && (
        <div className="space-y-4">
          {protocol.primarySessions.map((session) => (
            <StrengthCard
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
        <div className="space-y-4">
          {protocol.primarySessions.map((session) => (
            <StrengthCard
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
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">
                Muscle Preservation — Required on GLP-1
              </p>
              <p className="text-xs text-red-700 mt-1">{protocol.glp1Note}</p>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              💪 Complementary Strength Sessions
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Complete 2x/week to prevent muscle loss on GLP-1.
            </p>
          </div>

          {COMPLEMENTARY_STRENGTH_SESSIONS.map((session) => (
            <StrengthCard
              key={session.id}
              session={session}
              isDone={done.includes(session.id)}
              toggling={toggling === session.id}
              onToggle={() => toggleDay(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Workout cards ─────────────────────────────────────────────────────────────

interface StrengthCardProps {
  session: WorkoutSession;
  isDone: boolean;
  toggling: boolean;
  onToggle: () => void;
}

function StrengthCard({ session, isDone, toggling, onToggle }: StrengthCardProps) {
  return (
    <Card className={isDone ? "opacity-75" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{session.label}</CardTitle>
          <Badge variant={isDone ? "secondary" : "outline"}>~{session.duration}</Badge>
        </div>
        <p className="text-sm text-gray-500">{session.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {session.exercises && session.exercises.length > 0 && (
          <div className="divide-y">
            {session.exercises.map((ex) => (
              <div key={ex.name} className="py-2.5 flex justify-between items-start gap-2">
                <div>
                  <p className="text-sm font-medium">{ex.name}</p>
                  <p className="text-xs text-gray-400">{ex.why}</p>
                </div>
                <span className="text-sm text-gray-600 shrink-0">
                  {ex.sets} × {ex.reps}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button
          variant={isDone ? "secondary" : "default"}
          className="w-full"
          onClick={onToggle}
          disabled={toggling}
        >
          {toggling ? (
            "Saving…"
          ) : isDone ? (
            <><CheckCircle2 className="h-4 w-4 mr-2" /> Done this week</>
          ) : (
            <><Circle className="h-4 w-4 mr-2" /> Mark as done (+5 pts)</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

interface PrimarySessionCardProps {
  session: WorkoutSession;
}

function PrimarySessionCard({ session }: PrimarySessionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{session.label}</CardTitle>
          <Badge variant="outline">{session.duration}</Badge>
        </div>
        <p className="text-sm text-gray-500">{session.description}</p>
      </CardHeader>
    </Card>
  );
}
