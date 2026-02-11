import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendDigitalDownloadEmail, sendOrderConfirmationEmail } from "@/lib/email";

const PRODUCT_NAMES: Record<string, string> = {
  digital: "Download Digital",
  print: "Fine Art Print",
  canvas: "Quadro Canvas",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    console.log("🔔 Webhook received:", event, JSON.stringify(data, null, 2));

    if (event === "billing.paid") {
      const billingId = data?.id;

      if (!billingId) {
        console.error("No billing ID in webhook");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Find the order by billing_id
      const { data: order, error: orderError } = await supabaseAdmin
        .from("pets_orders")
        .select("id, product_type, generation_id, customer_id, price_cents, size")
        .eq("billing_id", billingId)
        .single();

      if (orderError || !order) {
        console.error("Order not found for billing:", billingId, orderError);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Get customer info
      const { data: customer } = await supabaseAdmin
        .from("pets_customers")
        .select("email, name")
        .eq("id", order.customer_id)
        .single();

      if (!customer) {
        console.error("Customer not found:", order.customer_id);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Update order status
      await supabaseAdmin
        .from("pets_orders")
        .update({
          status: order.product_type === "digital" ? "paid" : "processing",
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      console.log(`✅ Order ${order.id} marked as paid (${order.product_type})`);

      // For digital products: generate signed URL + send download email
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
            // Send download email
            try {
              await sendDigitalDownloadEmail(
                customer.email,
                customer.name,
                signedUrl.signedUrl
              );
              console.log(`📧 Download email sent to ${customer.email}`);
            } catch (emailErr) {
              console.error("Failed to send download email:", emailErr);
            }

            await supabaseAdmin
              .from("pets_orders")
              .update({
                notes: `Download URL (7 dias): ${signedUrl.signedUrl}`,
                status: "delivered",
              })
              .eq("id", order.id);
          }
        }
      } else {
        // Physical product: send order confirmation email
        try {
          const priceFormatted = `R$ ${(order.price_cents / 100).toFixed(2).replace(".", ",")}`;
          await sendOrderConfirmationEmail(
            customer.email,
            customer.name,
            PRODUCT_NAMES[order.product_type] || order.product_type,
            priceFormatted,
            order.id
          );
          console.log(`📧 Confirmation email sent to ${customer.email}`);
        } catch (emailErr) {
          console.error("Failed to send confirmation email:", emailErr);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
