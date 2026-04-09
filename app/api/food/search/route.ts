import { NextRequest, NextResponse } from "next/server";
import { searchFoods } from "@/lib/usda";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ foods: [] });
  }
  const foods = await searchFoods(q);
  return NextResponse.json({ foods });
}
