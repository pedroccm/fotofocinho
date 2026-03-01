import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generatePetPortrait } from "@/lib/gemini";
import { applyWatermark } from "@/lib/watermark";
import { supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

const ANON_LIMIT = 1;
const AUTH_LIMIT = 3;

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // --- Pre-validation (non-streaming, fast checks) ---
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

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

  // Check generation limits (return JSON for limit errors)
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

  // --- Streaming response to avoid gateway timeout ---
  const encoder = new TextEncoder();
  const generationId = uuidv4();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const ext = file.type === "image/png" ? "png" : "jpg";
  const mimeType = file.type;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Heartbeat every 5s to keep connection alive
      const heartbeat = setInterval(() => {
        send({ status: "generating" });
      }, 5000);

      try {
        send({ status: "uploading" });

        // 1. Upload original
        const originalPath = `${generationId}/original.${ext}`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from("originals")
          .upload(originalPath, buffer, { contentType: mimeType, upsert: false });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Erro ao salvar imagem original");
        }

        // 2. Create generation record
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

        send({ status: "generating" });

        // 3. Call AI API
        let generatedBase64: string;
        try {
          generatedBase64 = await generatePetPortrait(base64, mimeType, style);
        } catch (genError) {
          await supabaseAdmin
            .from("pets_generations")
            .update({ status: "failed" })
            .eq("id", generationId);
          throw genError;
        }

        send({ status: "processing" });

        const generatedBuffer = Buffer.from(generatedBase64, "base64");

        // 4. Apply watermark
        const watermarkedBuffer = await applyWatermark(generatedBuffer);

        // 5. Upload clean version
        const generatedPath = `${generationId}/clean.jpg`;
        await supabaseAdmin.storage
          .from("generated")
          .upload(generatedPath, generatedBuffer, { contentType: "image/jpeg", upsert: false });

        // 6. Upload watermarked version
        const watermarkedPath = `${generationId}/preview.jpg`;
        await supabaseAdmin.storage
          .from("watermarked")
          .upload(watermarkedPath, watermarkedBuffer, { contentType: "image/jpeg", upsert: false });

        // 7. Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage
          .from("watermarked")
          .getPublicUrl(watermarkedPath);

        // 8. Update generation record
        await supabaseAdmin
          .from("pets_generations")
          .update({
            status: "completed",
            generated_image_path: generatedPath,
            watermarked_image_path: watermarkedPath,
          })
          .eq("id", generationId);

        clearInterval(heartbeat);
        send({
          status: "completed",
          success: true,
          generationId,
          watermarkedImage: publicUrlData.publicUrl,
        });
      } catch (error) {
        clearInterval(heartbeat);
        console.error("Generation error:", error);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        send({ status: "error", error: `Falha ao gerar retrato: ${message}` });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
