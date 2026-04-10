const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const API_KEY = process.env.USDA_API_KEY ?? "DEMO_KEY";

export interface USDAFood {
  fdcId: number;
  description: string;
  proteinPer100g: number;
  caloriesPer100g: number;
}

export async function searchFoods(query: string): Promise<USDAFood[]> {
  const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query)}&dataType=SR%20Legacy,Foundation&pageSize=15&api_key=${API_KEY}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];

  const data = await res.json();
  const foods: USDAFood[] = [];

  for (const food of data.foods ?? []) {
    const nutrients: Record<string, number> = {};
    for (const n of food.foodNutrients ?? []) {
      if (n.nutrientName === "Protein") nutrients.protein = n.value;
      if (n.nutrientName === "Energy") nutrients.calories = n.value;
    }
    foods.push({
      fdcId: food.fdcId,
      description: food.description,
      proteinPer100g: nutrients.protein ?? 0,
      caloriesPer100g: nutrients.calories ?? 0,
    });
  }

  return foods;
}
