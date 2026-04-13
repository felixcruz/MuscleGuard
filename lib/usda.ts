const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const API_KEY = process.env.USDA_API_KEY ?? "DEMO_KEY";

export interface FoodPortion {
  label: string;
  gramWeight: number;
}

export interface USDAFood {
  fdcId: number;
  description: string;
  brandName: string | null;
  proteinPer100g: number;
  caloriesPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  portions: FoodPortion[];
}

function cleanDescription(desc: string): string {
  // Remove USDA verbose descriptions
  return desc
    .replace(/,\s*(raw|cooked|boiled|baked|fried|roasted|grilled|steamed|canned|frozen|dried|fresh|whole|boneless|skinless|lean only|separable lean and fat|all grades|choice|select|trimmed to[^,]*)*/gi, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function searchFoods(query: string): Promise<USDAFood[]> {
  const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&dataType=SR%20Legacy,Foundation,Branded&pageSize=15&api_key=${API_KEY}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`USDA API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const foods: USDAFood[] = [];

  for (const food of data.foods ?? []) {
    const nutrients: Record<string, number> = {};
    for (const n of food.foodNutrients ?? []) {
      if (n.nutrientName === "Protein") nutrients.protein = n.value;
      if (n.nutrientName === "Energy" && n.unitName === "KCAL") nutrients.calories = n.value;
      if (n.nutrientName === "Total lipid (fat)") nutrients.fat = n.value;
      if (n.nutrientName === "Carbohydrate, by difference") nutrients.carbs = n.value;
    }

    // Extract portions/serving sizes
    const portions: FoodPortion[] = [];

    // Always include grams as base unit
    portions.push({ label: "g", gramWeight: 1 });

    // Add oz
    portions.push({ label: "oz", gramWeight: 28.35 });

    // Add food-specific portions from USDA
    if (food.foodPortions) {
      for (const p of food.foodPortions) {
        if (p.portionDescription && p.gramWeight) {
          portions.push({
            label: p.portionDescription,
            gramWeight: Math.round(p.gramWeight * 10) / 10,
          });
        } else if (p.modifier && p.gramWeight) {
          portions.push({
            label: p.modifier,
            gramWeight: Math.round(p.gramWeight * 10) / 10,
          });
        }
      }
    }

    // For branded foods, use servingSize
    if (food.servingSize && food.servingSizeUnit) {
      const servingLabel = `serving (${food.servingSize}${food.servingSizeUnit})`;
      if (!portions.some(p => p.label.includes("serving"))) {
        portions.push({
          label: servingLabel,
          gramWeight: food.servingSize,
        });
      }
    }

    // Add common units based on food type
    const descLower = (food.description ?? "").toLowerCase();
    if (descLower.includes("egg") && !portions.some(p => p.label.includes("egg"))) {
      portions.push({ label: "large egg", gramWeight: 50 });
    }
    if ((descLower.includes("protein") || descLower.includes("whey")) && !portions.some(p => p.label.includes("scoop"))) {
      portions.push({ label: "scoop", gramWeight: 30 });
    }
    if (descLower.includes("cup") || descLower.includes("yogurt") || descLower.includes("rice") || descLower.includes("oat")) {
      if (!portions.some(p => p.label === "cup")) {
        portions.push({ label: "cup", gramWeight: 240 });
      }
    }

    foods.push({
      fdcId: food.fdcId,
      description: cleanDescription(food.description ?? ""),
      brandName: food.brandName ?? food.brandOwner ?? null,
      proteinPer100g: Math.round((nutrients.protein ?? 0) * 10) / 10,
      caloriesPer100g: Math.round(nutrients.calories ?? 0),
      fatPer100g: Math.round((nutrients.fat ?? 0) * 10) / 10,
      carbsPer100g: Math.round((nutrients.carbs ?? 0) * 10) / 10,
      portions,
    });
  }

  // Sort by protein content descending
  return foods.sort((a, b) => b.proteinPer100g - a.proteinPer100g);
}
