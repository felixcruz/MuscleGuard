"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Flame, Trophy } from "lucide-react";

const WORKOUT_DAYS = [
  {
    id: "A",
    label: "Day A — Upper Body",
    description: "Push + pull movements to preserve chest, back, and arms.",
    exercises: [
      { name: "Push-ups", sets: 3, reps: "10-15", why: "Chest & triceps activation" },
      { name: "Dumbbell rows", sets: 3, reps: "10-12 each", why: "Back & biceps" },
      { name: "Dumbbell shoulder press", sets: 3, reps: "10", why: "Shoulder preservation" },
      { name: "Bicep curls", sets: 3, reps: "12", why: "Direct arm stimulus" },
    ],
  },
  {
    id: "B",
    label: "Day B — Lower Body",
    description: "Legs and glutes hold most of your body's muscle mass.",
    exercises: [
      { name: "Goblet squat", sets: 3, reps: "12", why: "Quad & glute compound" },
      { name: "Hip hinge (RDL)", sets: 3, reps: "10", why: "Hamstrings & posterior chain" },
      { name: "Step-ups", sets: 3, reps: "10 each leg", why: "Single-leg stability" },
      { name: "Calf raises", sets: 3, reps: "15-20", why: "Lower leg retention" },
    ],
  },
  {
    id: "C",
    label: "Day C — Full Body",
    description: "Compound movements that hit everything in one session.",
    exercises: [
      { name: "Deadlift (or KB sumo)", sets: 3, reps: "8", why: "Highest muscle activation" },
      { name: "Dumbbell bench press", sets: 3, reps: "10", why: "Horizontal push pattern" },
      { name: "Band pull-aparts", sets: 3, reps: "15", why: "Rear delt & posture" },
      { name: "Plank", sets: 3, reps: "30-45s", why: "Core & trunk stability" },
    ],
  },
];

interface Props {
  weekKey: string;
  initialDone: string[];
  workoutStreakDays: number;
  proteinStreakDays: number;
  totalPoints: number;
}

export function TrainingClient({ weekKey, initialDone, workoutStreakDays, proteinStreakDays, totalPoints }: Props) {
  const [done, setDone] = useState<string[]>(initialDone);
  const [streak, setStreak] = useState(workoutStreakDays);
  const [points, setPoints] = useState(totalPoints);
  const [toggling, setToggling] = useState<string | null>(null);

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
      setDone(prev => [...prev, id]);
      if (typeof data.streak === "number") setStreak(data.streak);
      setPoints(p => p + 5);
    } else {
      setDone(prev => prev.filter(d => d !== id));
    }
    setToggling(null);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

      {/* ── Header + streak badges ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strength training</h1>
          <p className="text-gray-500 mt-1 text-sm max-w-xs">
            3 sessions per week, 20 min each. Resistance training is the #1 way to preserve
            muscle on GLP-1.
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
        {WORKOUT_DAYS.map((day) => (
          <div
            key={day.id}
            className={`h-2.5 flex-1 rounded-full transition-colors ${done.includes(day.id) ? "bg-green-500" : "bg-gray-200"}`}
          />
        ))}
        <span className="text-sm font-semibold text-green-700 ml-1">{done.length}/3</span>
        {done.length === 3 && <span className="text-sm">🏆</span>}
      </div>

      {/* Points */}
      <div className="flex items-center gap-1.5 justify-center">
        <Flame className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-xs text-gray-400 font-medium">{points} total points · +5 per workout</span>
      </div>

      {/* Workout cards */}
      <div className="space-y-4">
        {WORKOUT_DAYS.map((day) => {
          const isDone = done.includes(day.id);
          return (
            <Card key={day.id} className={isDone ? "opacity-75" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{day.label}</CardTitle>
                  <Badge variant={isDone ? "secondary" : "outline"}>~20 min</Badge>
                </div>
                <p className="text-sm text-gray-500">{day.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y">
                  {day.exercises.map((ex) => (
                    <div key={ex.name} className="py-2.5 flex justify-between items-start gap-2">
                      <div>
                        <p className="text-sm font-medium">{ex.name}</p>
                        <p className="text-xs text-gray-400">{ex.why}</p>
                      </div>
                      <span className="text-sm text-gray-600 shrink-0">{ex.sets} × {ex.reps}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={isDone ? "secondary" : "default"}
                  className="w-full"
                  onClick={() => toggleDay(day.id)}
                  disabled={toggling === day.id}
                >
                  {toggling === day.id ? (
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
        })}
      </div>
    </div>
  );
}
