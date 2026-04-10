import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  // TEMPORARY TEST ENDPOINT - REMOVE BEFORE PRODUCTION
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "test@example.com",
    password: "Test123456!",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ 
    success: true, 
    user: data.user,
    session: data.session 
  });
}