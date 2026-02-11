import { NextRequest, NextResponse } from "next/server";
import { createBilling, PRODUCTS, ProductType } from "@/lib/abacatepay";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productType,
      generationId,
      size,
      customer,
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
    }

    // 2. Create billing in AbacatePay
    const product = PRODUCTS[productType];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const sizeLabel = size ? ` - ${size}` : "";

    const billing = await createBilling({
      products: [
        {
          externalId: `${product.externalId}-${generationId}`,
          name: `${product.name}${sizeLabel}`,
          description: product.description,
          quantity: 1,
          price: product.price,
        },
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        cellphone: customer.cellphone,
        taxId: customer.taxId,
      },
      returnUrl: `${appUrl}/?generationId=${generationId}`,
      completionUrl: `${appUrl}/obrigado?generationId=${generationId}&product=${productType}`,
    });

    if (billing.error) {
      throw new Error(`AbacatePay: ${billing.error}`);
    }

    // 3. Update customer with AbacatePay ID
    if (billing.data.customer?.id) {
      await supabaseAdmin
        .from("pets_customers")
        .update({ abacatepay_id: billing.data.customer.id })
        .eq("id", customerId);
    }

    // 4. Create order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from("pets_orders")
      .insert({
        generation_id: generationId,
        customer_id: customerId,
        product_type: productType,
        size: size || null,
        price_cents: product.price,
        status: "pending_payment",
        billing_id: billing.data.id,
        payment_url: billing.data.url,
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
      billingId: billing.data.id,
      paymentUrl: billing.data.url,
      amount: billing.data.amount,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
