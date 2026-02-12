import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendShippingEmail } from "@/lib/email";

const PRODUCT_NAMES: Record<string, string> = {
  digital: "Download Digital",
  print: "Fine Art Print",
  canvas: "Quadro Canvas",
};

// Simple admin auth via secret header
function isAuthorized(request: NextRequest): boolean {
  const adminKey = request.headers.get("x-admin-key");
  return adminKey === process.env.ADMIN_SECRET_KEY;
}

// GET /api/admin/orders - List all orders
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("pets_orders")
    .select(`
      *,
      pets_customers ( name, email, cellphone, tax_id ),
      pets_generations ( style, generated_image_path, watermarked_image_path )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: orders, error, count } = await query;

  if (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 });
  }

  return NextResponse.json({
    orders,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// PATCH /api/admin/orders - Update order (status, tracking, notes)
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { orderId, status, trackingCode, notes } = body;

  if (!orderId) {
    return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (trackingCode) {
    updates.tracking_code = trackingCode;
    updates.shipped_at = new Date().toISOString();
  }
  if (notes !== undefined) updates.notes = notes;

  const { error } = await supabaseAdmin
    .from("pets_orders")
    .update(updates)
    .eq("id", orderId);

  if (error) {
    console.error("Admin update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 });
  }

  // Send shipping email when tracking code is added
  if (trackingCode && status === "shipped") {
    try {
      // Get order with customer data
      const { data: order } = await supabaseAdmin
        .from("pets_orders")
        .select("product_type, customer_id")
        .eq("id", orderId)
        .single();

      if (order) {
        const { data: customer } = await supabaseAdmin
          .from("pets_customers")
          .select("email, name")
          .eq("id", order.customer_id)
          .single();

        if (customer) {
          await sendShippingEmail(
            customer.email,
            customer.name,
            trackingCode,
            PRODUCT_NAMES[order.product_type] || order.product_type
          );
          console.log(`📧 Shipping email sent to ${customer.email}`);
        }
      }
    } catch (emailErr) {
      console.error("Failed to send shipping email:", emailErr);
      // Don't fail the request because of email error
    }
  }

  return NextResponse.json({ success: true });
}
