import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropic, MEAL_MODEL } from "@/lib/anthropic";
import { validateMealGenerationRequest } from "@/lib/api-validation";
import { checkRateLimit } from "@/lib/rate-limit";

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

  const { proteinRemainingG, dietaryPrefs } = validation.data!;

  const prefsText =
    dietaryPrefs?.length > 0
      ? `Dietary requirements: ${dietaryPrefs.join(", ")}.`
      : "No dietary restrictions.";

  const message = await getAnthropic().messages.create({
    model: MEAL_MODEL,
    max_tokens: 1500,
    system: `You are a GLP-1 nutritional coach specializing in muscle preservation.
Users are on Ozempic, Wegovy, or Mounjaro and have severely reduced appetite.
Your meals must be: 200-300g max portion size, at least 25g protein per meal, nutrient-dense, easy to prepare (under 15 minutes), and appetizing despite low hunger.
Always return valid JSON only — no markdown, no extra text.`,
    messages: [
      {
        role: "user",
        content: `Generate 4 high-protein meal ideas for someone who needs ${proteinRemainingG}g more protein today. ${prefsText}
Return a JSON array with this exact structure:
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
