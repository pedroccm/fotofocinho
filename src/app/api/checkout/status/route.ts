import { NextRequest, NextResponse } from "next/server";
import { checkPixStatus } from "@/lib/abacatepay";
import { supabaseAdmin } from "@/lib/supabase";
import { sendDigitalDownloadEmail, sendOrderConfirmationEmail } from "@/lib/email";

const PRODUCT_NAMES: Record<string, string> = {
  digital: "Download Digital",
  print: "Fine Art Print",
  canvas: "Quadro Canvas",
};

async function fulfillOrder(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from("pets_orders")
    .select("id, product_type, generation_id, customer_id, price_cents, size, status")
    .eq("id", orderId)
    .single();

  if (!order || order.status !== "pending_payment") return;

  const { data: customer } = await supabaseAdmin
    .from("pets_customers")
    .select("email, name")
    .eq("id", order.customer_id)
    .single();

  await supabaseAdmin
    .from("pets_orders")
    .update({
      status: order.product_type === "digital" ? "paid" : "processing",
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (!customer) return;

  if (order.product_type === "digital") {
    const { data: generation } = await supabaseAdmin
      .from("pets_generations")
      .select("generated_image_path")
      .eq("id", order.generation_id)
      .single();

    if (generation?.generated_image_path) {
      const { data: signedUrl } = await supabaseAdmin.storage
        .from("generated")
        .createSignedUrl(generation.generated_image_path, 60 * 60 * 24 * 7);

      if (signedUrl) {
        try {
          await sendDigitalDownloadEmail(customer.email, customer.name, signedUrl.signedUrl);
        } catch (emailErr) {
          console.error("Failed to send download email:", emailErr);
        }

        await supabaseAdmin
          .from("pets_orders")
          .update({ notes: `Download URL (7 dias): ${signedUrl.signedUrl}`, status: "delivered" })
          .eq("id", order.id);
      }
    }
  } else {
    try {
      const priceFormatted = `R$ ${(order.price_cents / 100).toFixed(2).replace(".", ",")}`;
      await sendOrderConfirmationEmail(
        customer.email,
        customer.name,
        PRODUCT_NAMES[order.product_type] || order.product_type,
        priceFormatted,
        order.id
      );
    } catch (emailErr) {
      console.error("Failed to send confirmation email:", emailErr);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const pixId = request.nextUrl.searchParams.get("pixId");
    const orderId = request.nextUrl.searchParams.get("orderId");
    const simulate = request.nextUrl.searchParams.get("simulate");

    if (!pixId || !orderId) {
      return NextResponse.json({ error: "pixId and orderId required" }, { status: 400 });
    }

    // Dev-only: simulate payment
    if (simulate === "true" && process.env.NODE_ENV === "development") {
      await fulfillOrder(orderId);
      return NextResponse.json({ status: "PAID", expiresAt: null });
    }

    const statusResponse = await checkPixStatus(pixId);

    if (statusResponse.error) {
      throw new Error(`AbacatePay: ${statusResponse.error}`);
    }

    const pixStatus = statusResponse.data.status;

    if (pixStatus === "PAID") {
      await fulfillOrder(orderId);
    }

    return NextResponse.json({
      status: pixStatus,
      expiresAt: statusResponse.data.expiresAt,
    });
  } catch (error) {
    console.error("Status check error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
