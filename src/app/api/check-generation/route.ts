import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("pets_generations")
    .select("id, status, watermarked_image_path, error_message")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  if (data.status === "completed" && data.watermarked_image_path) {
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("watermarked")
      .getPublicUrl(data.watermarked_image_path);

    return NextResponse.json({
      status: "completed",
      watermarkedImage: publicUrlData.publicUrl,
    });
  }

  if (data.status === "failed") {
    return NextResponse.json({ status: "failed", error: data.error_message || "Unknown error" });
  }

  return NextResponse.json({ status: data.status });
}
