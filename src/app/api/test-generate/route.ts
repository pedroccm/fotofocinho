import { NextRequest, NextResponse } from "next/server";
import { generatePetPortrait } from "@/lib/gemini";

export const maxDuration = 120;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

async function getGenerationCost(generationId: string): Promise<{
  totalCost: number;
  tokensPrompt: number;
  tokensCompletion: number;
} | null> {
  // OpenRouter needs a few seconds to process generation stats
  await new Promise((r) => setTimeout(r, 5000));

  const res = await fetch(
    `https://openrouter.ai/api/v1/generation?id=${generationId}`,
    { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` } }
  );

  if (!res.ok) {
    console.error("Generation stats error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  console.log("Generation stats:", JSON.stringify(data, null, 2));

  return {
    totalCost: data.data?.total_cost ?? 0,
    tokensPrompt: data.data?.tokens_prompt ?? 0,
    tokensCompletion: data.data?.tokens_completion ?? 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const style = (formData.get("style") as string) || "renaissance";
    const model = (formData.get("model") as string) || "";
    const ratio = (formData.get("ratio") as string) || "4:5";

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

    // Generate
    const result = await generatePetPortrait(base64, file.type, style, "openrouter", model, ratio);

    // Get cost from generation stats API
    let cost = "N/A";
    let tokensPrompt = "N/A";
    let tokensCompletion = "N/A";

    if (result.generationId) {
      const stats = await getGenerationCost(result.generationId);
      if (stats) {
        cost = `$${stats.totalCost.toFixed(6)}`;
        tokensPrompt = stats.tokensPrompt.toLocaleString();
        tokensCompletion = stats.tokensCompletion.toLocaleString();
      }
    }

    return NextResponse.json({
      image: `data:image/png;base64,${result.image}`,
      cost,
      tokensPrompt,
      tokensCompletion,
      generationId: result.generationId,
    });
  } catch (error) {
    console.error("Test generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
