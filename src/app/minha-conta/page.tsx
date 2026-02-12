import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import CustomerDashboard from "./CustomerDashboard";

interface Order {
  order_id: string;
  product_type: string;
  size: string | null;
  price_cents: number;
  status: string;
  tracking_code: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  created_at: string;
  style: string;
  generated_image_path: string | null;
  watermarked_image_path: string | null;
}

export default async function MinhaContaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get customer data and orders using service role
  const supabaseAdmin = getSupabaseAdmin();

  // Find customer by email (linked to auth user)
  const { data: customer } = await supabaseAdmin
    .from("pets_customers")
    .select("*")
    .eq("email", user.email)
    .single();

  let orders: Order[] = [];
  if (customer) {
    const { data: ordersData } = await supabaseAdmin
      .from("pets_orders")
      .select(`
        id,
        product_type,
        size,
        price_cents,
        status,
        tracking_code,
        paid_at,
        shipped_at,
        created_at,
        pets_generations (
          style,
          generated_image_path,
          watermarked_image_path
        )
      `)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (ordersData) {
      orders = ordersData.map((order) => {
        const gen = order.pets_generations as unknown as {
          style: string;
          generated_image_path: string | null;
          watermarked_image_path: string | null;
        } | null;

        return {
          order_id: order.id,
          product_type: order.product_type,
          size: order.size,
          price_cents: order.price_cents,
          status: order.status,
          tracking_code: order.tracking_code,
          paid_at: order.paid_at,
          shipped_at: order.shipped_at,
          created_at: order.created_at,
          style: gen?.style || "renaissance",
          generated_image_path: gen?.generated_image_path || null,
          watermarked_image_path: gen?.watermarked_image_path || null,
        };
      });
    }
  }

  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "Customer";

  return (
    <CustomerDashboard
      userName={userName}
      userEmail={user.email || ""}
      orders={orders}
    />
  );
}
