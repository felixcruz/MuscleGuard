import { NextRequest, NextResponse } from "next/server";
import { searchFoods } from "@/lib/usda";

export async function GET(request: NextRequest) {
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
    return NextResponse.json(
      { error: message, foods: [] },
      { status: 500 }
    );
  }
}
