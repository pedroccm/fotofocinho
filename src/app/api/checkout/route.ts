import { NextRequest, NextResponse } from "next/server";
import { createPixQrCode } from "@/lib/abacatepay";
import { PRODUCTS, ProductType } from "@/lib/constants";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productType,
      generationId,
      size,
      customer,
      password,
      shippingAddress,
    }: {
      productType: ProductType;
      generationId: string;
      size?: string;
      customer: {
        name: string;
        email: string;
        cellphone: string;
        taxId: string;
      };
      password?: string;
      shippingAddress?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip: string;
      };
    } = body;

    // Validate
    if (!PRODUCTS[productType]) {
      return NextResponse.json({ error: "Tipo de produto inválido" }, { status: 400 });
    }
    if (!generationId) {
      return NextResponse.json({ error: "ID de geração é obrigatório" }, { status: 400 });
    }
    if (!customer?.name || !customer?.email || !customer?.taxId) {
      return NextResponse.json({ error: "Dados do cliente obrigatórios (nome, email, CPF)" }, { status: 400 });
    }

    // Physical products need shipping address
    if ((productType === "print" || productType === "canvas") && !shippingAddress) {
      return NextResponse.json({ error: "Endereço de entrega é obrigatório para produtos físicos" }, { status: 400 });
    }

    // Verify generation exists
    const { data: generation, error: genError } = await supabaseAdmin
      .from("pets_generations")
      .select("id, status")
      .eq("id", generationId)
      .single();

    if (genError || !generation) {
      return NextResponse.json({ error: "Geração não encontrada" }, { status: 404 });
    }

    if (generation.status !== "completed") {
      return NextResponse.json({ error: "Imagem ainda não foi gerada" }, { status: 400 });
    }

    // 1. Upsert customer in Supabase
    const { data: existingCustomer } = await supabaseAdmin
      .from("pets_customers")
      .select("id")
      .eq("email", customer.email)
      .single();

    let customerId: string;
    let isNewCustomer = false;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update info
      await supabaseAdmin
        .from("pets_customers")
        .update({
          name: customer.name,
          cellphone: customer.cellphone,
          tax_id: customer.taxId,
        })
        .eq("id", customerId);
    } else {
      const { data: newCustomer, error: custError } = await supabaseAdmin
        .from("pets_customers")
        .insert({
          name: customer.name,
          email: customer.email,
          cellphone: customer.cellphone,
          tax_id: customer.taxId,
        })
        .select("id")
        .single();

      if (custError || !newCustomer) {
        throw new Error("Erro ao criar cliente");
      }
      customerId = newCustomer.id;
      isNewCustomer = true;

      // Create Supabase Auth user with customer-chosen password
      if (password && password.length >= 6) {
        try {
          const { error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: customer.email,
            password,
            email_confirm: true,
            user_metadata: { name: customer.name },
          });
          if (authError) throw authError;
        } catch (authErr) {
          // User might already exist in auth (registered manually)
          console.log("Auth user creation skipped:", authErr);
          isNewCustomer = false;
        }
      }
    }

    // Send welcome email for new accounts
    if (isNewCustomer) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      try {
        await sendWelcomeEmail(
          customer.email,
          customer.name,
          `${appUrl}/login`
        );
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
      }
    }

    // 2. Create PIX QR Code in AbacatePay
    const product = PRODUCTS[productType];
    const description = product.name.substring(0, 37);

    const pix = await createPixQrCode({
      amount: product.price,
      description,
      expiresIn: 1800, // 30 minutes
      customer: {
        name: customer.name,
        email: customer.email,
        cellphone: customer.cellphone,
        taxId: customer.taxId,
      },
    });

    if (pix.error) {
      throw new Error(`AbacatePay: ${pix.error}`);
    }

    // 3. Create order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from("pets_orders")
      .insert({
        generation_id: generationId,
        customer_id: customerId,
        product_type: productType,
        size: size || null,
        price_cents: product.price,
        status: "pending_payment",
        billing_id: pix.data.id,
        payment_url: null,
        shipping_address: shippingAddress || null,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error("Erro ao criar pedido");
    }

    return NextResponse.json({
      success: true,
      orderId: order?.id,
      pixId: pix.data.id,
      brCode: pix.data.brCode,
      brCodeBase64: pix.data.brCodeBase64,
      amount: pix.data.amount,
      expiresAt: pix.data.expiresAt,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
