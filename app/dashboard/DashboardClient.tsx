"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProteinRing } from "@/components/dashboard/ProteinRing";
import { QuickLogForm } from "@/components/dashboard/QuickLogForm";
import { TodayFoodLog } from "@/components/dashboard/TodayFoodLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FoodLogEntry {
  id: string;
  food_name: string;
  protein_g: number;
  calories: number | null;
  portion_g: number | null;
}

interface Props {
  userId: string;
  proteinGoalG: number;
  initialLogs: FoodLogEntry[];
}

export function DashboardClient({ userId, proteinGoalG, initialLogs }: Props) {
  const [logs, setLogs] = useState<FoodLogEntry[]>(initialLogs);
  // NOTE: createClient() is memoized in Supabase SSR, so this is already optimized
  const supabase = createClient();

  const totalProtein = logs.reduce((sum, l) => sum + Number(l.protein_g), 0);

  const refreshLogs = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("food_logs")
      .select("id, food_name, protein_g, calories, portion_g")
      .eq("user_id", userId)
      .eq("log_date", today)
      .order("logged_at", { ascending: true });
    setLogs(data ?? []);
  }, [supabase, userId]);

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Protein Ring */}
      <Card>
        <CardContent className="pt-8 pb-6 flex justify-center">
          <ProteinRing goalG={proteinGoalG} loggedG={totalProtein} />
        </CardContent>
      </Card>

      {/* Log food */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Log protein</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickLogForm userId={userId} onLogged={refreshLogs} />
        </CardContent>
      </Card>

      {/* Today's log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today&apos;s food</CardTitle>
        </CardHeader>
        <CardContent>
          <TodayFoodLog entries={logs} onDeleted={refreshLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
