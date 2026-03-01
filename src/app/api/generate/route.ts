import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

const ANON_LIMIT = 1;
const AUTH_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    // Extract IP address
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Try to get authenticated user
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

    // Check generation limits
    if (user) {
      const { count } = await supabaseAdmin
        .from("pets_generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      if ((count ?? 0) >= AUTH_LIMIT) {
        return NextResponse.json(
          { error: "LIMIT_REACHED", message: "Você atingiu o limite de 3 retratos gratuitos!" },
          { status: 429 }
        );
      }
    } else {
      const { count } = await supabaseAdmin
        .from("pets_generations")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .is("user_id", null)
        .eq("status", "completed");

      if ((count ?? 0) >= ANON_LIMIT) {
        return NextResponse.json(
          { error: "ANON_LIMIT_REACHED", message: "Crie uma conta para continuar gerando!" },
          { status: 429 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const style = (formData.get("style") as string) || "renaissance";

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WebP." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem muito grande. Máximo 10MB." }, { status: 400 });
    }

    const generationId = uuidv4();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.type === "image/png" ? "png" : "jpg";

    // 1. Upload original to Supabase Storage
    const originalPath = `${generationId}/original.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("originals")
      .upload(originalPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Erro ao salvar imagem original");
    }

    // 2. Create generation record (status: generating)
    const { error: insertError } = await supabaseAdmin
      .from("pets_generations")
      .insert({
        id: generationId,
        style,
        original_image_path: originalPath,
        status: "generating",
        user_id: user?.id || null,
        ip_address: ip,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Erro ao criar registro");
    }

    // 3. Fire background function (fire-and-forget, runs up to 15 minutes)
    const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || "https://fotofocinho.com.br";
    fetch(`${siteUrl}/.netlify/functions/process-generation-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationId,
        style,
        originalPath,
        mimeType: file.type,
      }),
    }).catch((err) => {
      console.error("Failed to trigger background function:", err);
    });

    // 4. Return immediately
    return NextResponse.json({
      success: true,
      generationId,
    });
  } catch (error) {
    console.error("Generation error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: `Falha ao gerar retrato: ${message}` }, { status: 500 });
  }
}
