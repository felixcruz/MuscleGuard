"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

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

function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `mg-training-week-${now.getFullYear()}-${week}`;
}

export default function TrainingPage() {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(getWeekKey());
    if (stored) setDone(JSON.parse(stored));
  }, []);

  function toggleDay(id: string) {
    const updated = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(updated);
    localStorage.setItem(getWeekKey(), JSON.stringify(updated));
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Strength training</h1>
        <p className="text-gray-500 mt-1">
          3 sessions per week, 20 minutes each. Resistance training is the #1 way to signal your
          body to keep muscle while losing fat on GLP-1.
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-500">This week:</span>
        {WORKOUT_DAYS.map((day) => (
          <div
            key={day.id}
            className={`h-2.5 w-8 rounded-full ${done.includes(day.id) ? "bg-brand-500" : "bg-gray-200"}`}
          />
        ))}
        <span className="text-sm font-medium text-brand-700">{done.length}/3 done</span>
      </div>

      <div className="space-y-4">
        {WORKOUT_DAYS.map((day) => (
          <Card key={day.id} className={done.includes(day.id) ? "opacity-70" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{day.label}</CardTitle>
                <Badge variant={done.includes(day.id) ? "secondary" : "outline"}>
                  ~20 min
                </Badge>
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
                    <span className="text-sm text-gray-600 shrink-0">
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                variant={done.includes(day.id) ? "secondary" : "default"}
                className="w-full"
                onClick={() => toggleDay(day.id)}
              >
                {done.includes(day.id) ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Done this week
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 mr-2" /> Mark as done
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
