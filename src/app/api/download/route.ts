import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  // Get authenticated user
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Get customer by email
  const { data: customer } = await supabaseAdmin
    .from("pets_customers")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Get order and verify ownership
  const { data: order } = await supabaseAdmin
    .from("pets_orders")
    .select(`
      id,
      customer_id,
      status,
      generation_id,
      pets_generations (
        generated_image_path
      )
    `)
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Verify ownership
  if (order.customer_id !== customer.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Verify payment status
  if (!["paid", "processing", "shipped", "delivered"].includes(order.status)) {
    return NextResponse.json({ error: "Payment required" }, { status: 402 });
  }

  // Get the clean image path
  const generation = order.pets_generations as { generated_image_path: string | null } | null;
  const imagePath = generation?.generated_image_path;

  if (!imagePath) {
    return NextResponse.json({ error: "Image not available" }, { status: 404 });
  }

  // Download image from storage
  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from("generated")
    .download(imagePath);

  if (downloadError || !fileData) {
    console.error("Download error:", downloadError);
    return NextResponse.json({ error: "Failed to download image" }, { status: 500 });
  }

  // Return the image
  const buffer = await fileData.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="fable-portrait-${orderId}.jpg"`,
    },
  });
}
