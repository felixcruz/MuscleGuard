"use client";

import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

interface FoodLogEntry {
  id: string;
  food_name: string;
  protein_g: number;
  calories: number | null;
  portion_g: number | null;
  logged_at?: string | null;
}

interface Props {
  entries: FoodLogEntry[];
  onDeleted: () => void;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function TodayFoodLog({ entries, onDeleted }: Props) {
  const supabase = createClient();

  async function handleDelete(id: string) {
    await supabase.from("food_logs").delete().eq("id", id);
    onDeleted();
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        Nothing logged yet today. Add your first meal above.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 line-clamp-1">{entry.food_name}</p>
            <p className="text-xs text-gray-400">
              {entry.portion_g ? `${entry.portion_g}g · ` : ""}
              {entry.calories ? `${entry.calories} kcal` : ""}
              {entry.logged_at ? (
                <span className="text-gray-300 ml-1">· {formatTime(entry.logged_at)}</span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-2">
            <span className="text-sm font-semibold text-brand-700">+{entry.protein_g}g</span>
            <button
              onClick={() => handleDelete(entry.id)}
              className="text-gray-300 hover:text-red-400 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
