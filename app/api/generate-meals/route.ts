import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropic, MEAL_MODEL } from "@/lib/anthropic";
import { validateMealGenerationRequest } from "@/lib/api-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAIToneInstruction, type CommStyle } from "@/lib/comm-style";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limiting
  const rateLimit = checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    const resetAt = new Date(rateLimit.resetAt).toISOString();
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many requests. Please wait before generating more meals.",
        resetAt,
      },
      { status: 429 }
    );
  }

  let bodyData: unknown;
  try {
    bodyData = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const validation = validateMealGenerationRequest(bodyData);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 }
    );
  }

  const { proteinRemainingG, dietaryPrefs, ingredients, mealTime, hungerLevel, customRequest } = validation.data!;

  const { data: profile } = await supabase
    .from("profiles")
    .select("comm_style")
    .eq("id", user.id)
    .single();
  const commStyle = (profile?.comm_style ?? "balanced") as CommStyle;
  const toneInstruction = getAIToneInstruction(commStyle);

  const prefsText =
    dietaryPrefs?.length > 0
      ? `Dietary requirements: ${dietaryPrefs.join(", ")}.`
      : "No dietary restrictions.";

  const ingredientsText =
    ingredients && ingredients.length > 0
      ? `Use these available ingredients (prioritize them, but you can add simple pantry staples): ${ingredients.join(", ")}.`
      : "";

  const mealTimeText = mealTime
    ? {
        breakfast: "This is for breakfast — make it energizing, quick to prepare, and light but protein-rich.",
        lunch: "This is for lunch — balanced, satisfying but not too heavy, easy to prepare.",
        dinner: "This is for dinner — can be more satisfying and flavourful, but still high-protein and GLP-1 friendly.",
        snack: "This is a snack — keep it small (100-150g), very quick to prepare, high-protein.",
      }[mealTime] ?? ""
    : "";

  const hungerText = hungerLevel
    ? {
        low: "The user has very low appetite right now — keep portions at 120-180g max, ultra-light and easy to eat.",
        moderate: "The user has moderate appetite — standard 200-250g portions.",
        high: "The user is quite hungry — portions can be 250-320g, more satisfying options.",
      }[hungerLevel] ?? ""
    : "";

  const message = await getAnthropic().messages.create({
    model: MEAL_MODEL,
    max_tokens: 1500,
    system: `You are a GLP-1 nutritional coach specializing in muscle preservation.
Users are on Ozempic, Wegovy, or Mounjaro and have severely reduced appetite.
Your meals must be: nutrient-dense, easy to prepare (under 15 minutes), and appetizing despite low hunger.
${toneInstruction}
Always return valid JSON only — no markdown, no extra text.`,
    messages: [
      {
        role: "user",
        content: `Generate 3 high-protein meal ideas for someone who needs ${proteinRemainingG}g more protein today.
${prefsText} ${mealTimeText} ${hungerText} ${ingredientsText}${customRequest ? `\nThe user specifically requested: "${customRequest}". Prioritize this request.` : ""}
Each meal must have at least 25g protein.
Return a JSON array with exactly 3 items using this exact structure:
[
  {
    "name": "meal name",
    "protein_g": 32,
    "calories": 280,
    "prep_minutes": 5,
    "portion_g": 250,
    "ingredients": ["200g Greek yogurt", "30g protein powder", "handful of berries"],
    "instructions": "Mix yogurt with protein powder. Top with berries. Eat immediately."
  }
]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "No response" }, { status: 500 });
  }

  let meals;
  try {
    meals = JSON.parse(content.text);
  } catch {
    // Try to extract JSON array from response
    const match = content.text.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ error: "Invalid response" }, { status: 500 });
    meals = JSON.parse(match[0]);
  }

  // Save to DB for history
  await supabase.from("generated_meals").insert({
    user_id: user.id,
    meals,
    prefs_snapshot: { proteinRemainingG, dietaryPrefs },
  });

  return NextResponse.json({ meals });
}
