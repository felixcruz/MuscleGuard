import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFoods } from "@/lib/usda";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const q = request.nextUrl.searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ foods: [] });
    }

    if (q.length > 100) {
      return NextResponse.json(
        { error: "Search query too long (max 100 characters)" },
        { status: 400 }
      );
    }

    const foods = await searchFoods(q);
    return NextResponse.json({ foods });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to search foods";
    console.error("[food/search]", message);
    return NextResponse.json({ error: message, foods: [] });
  }
}
