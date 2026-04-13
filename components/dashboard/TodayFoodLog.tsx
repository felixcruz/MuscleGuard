"use client";

import { createClient } from "@/lib/supabase/client";
import { Trash2, Sunrise, Sun, Moon, Cookie } from "lucide-react";

interface FoodLogEntry {
  id: string;
  food_name: string;
  protein_g: number;
  calories: number | null;
  portion_g: number | null;
  logged_at?: string | null;
  meal_type?: string | null;
}

interface Props {
  entries: FoodLogEntry[];
  onDeleted: () => void;
}

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_CONFIG: Record<string, { label: string; icon: typeof Sunrise }> = {
  breakfast: { label: "Breakfast", icon: Sunrise },
  lunch: { label: "Lunch", icon: Sun },
  dinner: { label: "Dinner", icon: Moon },
  snack: { label: "Snack", icon: Cookie },
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getMealSlot(entry: FoodLogEntry): string {
  if (entry.meal_type && MEAL_ORDER.includes(entry.meal_type)) return entry.meal_type;
  // Infer from time if no meal_type
  if (!entry.logged_at) return "snack";
  const h = new Date(entry.logged_at).getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 17) return "snack";
  return "dinner";
}

export function TodayFoodLog({ entries, onDeleted }: Props) {
  const supabase = createClient();

  async function handleDelete(id: string) {
    await supabase.from("food_logs").delete().eq("id", id);
    onDeleted();
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-4">
        Nothing logged yet today. Add your first meal above.
      </p>
    );
  }

  // Group by meal type
  const grouped: Record<string, FoodLogEntry[]> = {};
  for (const entry of entries) {
    const slot = getMealSlot(entry);
    if (!grouped[slot]) grouped[slot] = [];
    grouped[slot].push(entry);
  }

  return (
    <div className="space-y-4">
      {MEAL_ORDER.map((slot) => {
        const items = grouped[slot];
        if (!items || items.length === 0) return null;
        const config = MEAL_CONFIG[slot];
        const Icon = config.icon;
        const slotProtein = items.reduce((s, e) => s + Number(e.protein_g), 0);

        return (
          <div key={slot}>
            {/* Meal header */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-mgray" />
                <span className="text-xs font-medium text-mgray">{config.label}</span>
              </div>
              <span className="text-xs font-medium text-green-600">{slotProtein}g</span>
            </div>
            {/* Items */}
            <div className="divide-y divide-black/5">
              {items.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-obsidian line-clamp-1">{entry.food_name}</p>
                    <p className="text-xs text-muted">
                      {entry.portion_g ? `${entry.portion_g}g · ` : ""}
                      {entry.calories ? `${entry.calories} kcal` : ""}
                      {entry.logged_at ? (
                        <span className="ml-1">· {formatTime(entry.logged_at)}</span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-sm font-semibold text-green-600">+{entry.protein_g}g</span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-muted hover:text-[#FFB4AB] transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
