"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MeasurementForm } from "@/components/progress/MeasurementForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Measurement {
  measured_at: string;
  weight_kg: number | null;
  muscle_mass_kg: number | null;
  body_fat_pct: number | null;
}

interface Props {
  userId: string;
  initialMeasurements: Measurement[];
}

function checkMuscleLoss(measurements: Measurement[]): boolean {
  if (measurements.length < 2) return false;
  const recent = measurements[measurements.length - 1];
  const weekAgo = measurements.find(
    (m) =>
      new Date(recent.measured_at).getTime() - new Date(m.measured_at).getTime() >=
      6 * 24 * 60 * 60 * 1000
  );
  if (!weekAgo || !recent.muscle_mass_kg || !weekAgo.muscle_mass_kg) return false;
  return weekAgo.muscle_mass_kg - recent.muscle_mass_kg > 1;
}

export function ProgressClient({ userId, initialMeasurements }: Props) {
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("body_measurements")
      .select("measured_at, weight_kg, muscle_mass_kg, body_fat_pct")
      .eq("user_id", userId)
      .order("measured_at", { ascending: true })
      .limit(60);
    setMeasurements(data ?? []);
  }, [supabase, userId]);

  const muscleLossAlert = checkMuscleLoss(measurements);

  const chartData = measurements.map((m) => ({
    date: new Date(m.measured_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: m.weight_kg,
    muscle: m.muscle_mass_kg,
  }));

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <p className="text-gray-500 mt-1">Track your weight and muscle mass weekly.</p>
      </div>

      {muscleLossAlert && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Muscle loss detected</p>
            <p className="text-sm text-red-700 mt-0.5">
              You lost more than 1kg of muscle this week. Check your{" "}
              <a href="/meals" className="underline font-medium">meal plan</a> and{" "}
              <a href="/training" className="underline font-medium">strength training</a>.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Log today&apos;s measurement</CardTitle>
        </CardHeader>
        <CardContent>
          <MeasurementForm userId={userId} onSaved={refresh} />
        </CardContent>
      </Card>

      {chartData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weight trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {chartData.some((d) => d.muscle !== null) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Muscle mass trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="muscle"
                  name="Muscle mass (kg)"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {measurements.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">
          Log your first measurement to start tracking your progress.
        </p>
      )}
    </div>
  );
}
