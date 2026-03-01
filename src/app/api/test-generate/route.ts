import { NextRequest, NextResponse } from "next/server";
import { generatePetPortrait } from "@/lib/gemini";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  const style = (formData.get("style") as string) || "renaissance";
  const aimlRatio = (formData.get("aimlRatio") as string) || "4:5";
  const openrouterRatio = (formData.get("openrouterRatio") as string) || "4:5";

  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid format. Use JPG, PNG or WebP." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large. Max 10MB." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");

  const models = [
    { provider: "aiml" as const, model: undefined, label: "AIML (Gemini 2.5 Flash)", ratio: aimlRatio },
    { provider: "openrouter" as const, model: "google/gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash (OpenRouter)", ratio: openrouterRatio },
  ];

  // Use SSE streaming to avoid gateway timeout
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const heartbeat = setInterval(() => {
        send({ status: "generating" });
      }, 5000);

      try {
        send({ status: "generating" });

        const results = await Promise.allSettled(
          models.map((m) => generatePetPortrait(base64, file.type, style, m.provider, m.model, m.ratio))
        );

        const output = results.map((result, i) => ({
          model: models[i].model || "aiml",
          label: models[i].label,
          image: result.status === "fulfilled" ? `data:image/jpeg;base64,${result.value}` : null,
          error: result.status === "rejected" ? (result.reason?.message || "Unknown error") : null,
        }));

        clearInterval(heartbeat);
        send({ status: "completed", results: output });
      } catch (error) {
        clearInterval(heartbeat);
        console.error("Test generation error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        send({ status: "error", error: `Generation failed: ${message}` });
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
