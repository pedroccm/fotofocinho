import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase";

const ANON_LIMIT = 1;
const AUTH_LIMIT = 3;

export async function GET(request: NextRequest) {
  try {
    // Try to get authenticated user from cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Logged in: count by user_id
      const { count, error } = await supabaseAdmin
        .from("pets_generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (error) throw error;

      const used = count ?? 0;
      return NextResponse.json({
        canGenerate: used < AUTH_LIMIT,
        count: used,
        limit: AUTH_LIMIT,
        authenticated: true,
      });
    }

    // Anonymous: count by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { count, error } = await supabaseAdmin
      .from("pets_generations")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .is("user_id", null)
      .eq("status", "completed");

    if (error) throw error;

    const used = count ?? 0;
    return NextResponse.json({
      canGenerate: used < ANON_LIMIT,
      count: used,
      limit: ANON_LIMIT,
      authenticated: false,
    });
  } catch (error) {
    console.error("Check limit error:", error);
    return NextResponse.json(
      { error: "Failed to check limit" },
      { status: 500 }
    );
  }
}
