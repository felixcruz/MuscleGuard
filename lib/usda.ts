const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const API_KEY = process.env.USDA_API_KEY ?? "DEMO_KEY";

export interface USDAFood {
  fdcId: number;
  description: string;
  proteinPer100g: number;
  caloriesPer100g: number;
}

export async function searchFoods(query: string): Promise<USDAFood[]> {
  // Include Branded foods so common items like "Greek yogurt" show results
  const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&dataType=SR%20Legacy,Foundation,Branded&pageSize=20&api_key=${API_KEY}`;

  // cache: 'no-store' — search results are user-input dependent, never cache
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
      // "Energy" can appear twice (kcal + kJ) — only take KCAL
      if (n.nutrientName === "Protein") nutrients.protein = n.value;
      if (n.nutrientName === "Energy" && n.unitName === "KCAL") nutrients.calories = n.value;
    }
    foods.push({
      fdcId: food.fdcId,
      description: food.description,
      proteinPer100g: Math.round((nutrients.protein ?? 0) * 10) / 10,
      caloriesPer100g: Math.round(nutrients.calories ?? 0),
    });
  }

  // Sort by protein content descending so high-protein foods appear first
  return foods.sort((a, b) => b.proteinPer100g - a.proteinPer100g);
}
