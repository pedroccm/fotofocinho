import { NextRequest, NextResponse } from "next/server";
import { generatePetPortrait } from "@/lib/gemini";

export const maxDuration = 120;

interface ModelResult {
  model: string;
  label: string;
  image: string | null;
  error: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const style = (formData.get("style") as string) || "renaissance";
    const nanoV1Ratio = (formData.get("nanoV1Ratio") as string) || "4:5";
    const nanoV2Ratio = (formData.get("nanoV2Ratio") as string) || "4:5";

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
      { provider: "openrouter" as const, model: "google/gemini-2.5-flash-image-preview", label: "Nano Banana (2.5 Flash)", ratio: nanoV1Ratio },
      { provider: "openrouter" as const, model: "google/gemini-3.1-flash-image-preview", label: "Nano Banana 2 (3.1 Flash)", ratio: nanoV2Ratio },
    ];

    const results = await Promise.allSettled(
      models.map((m) => generatePetPortrait(base64, file.type, style, m.provider, m.model, m.ratio))
    );

    const output: ModelResult[] = results.map((result, i) => ({
      model: models[i].model,
      label: models[i].label,
      image: result.status === "fulfilled" ? `data:image/jpeg;base64,${result.value}` : null,
      error: result.status === "rejected" ? (result.reason?.message || "Unknown error") : null,
    }));

    return NextResponse.json({ results: output });
  } catch (error) {
    console.error("Test generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 500 });
  }
}
