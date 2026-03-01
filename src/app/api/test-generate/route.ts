import { NextRequest, NextResponse } from "next/server";
import { generatePetPortrait } from "@/lib/gemini";

export const maxDuration = 120;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

async function getOpenRouterBalance(): Promise<number> {
  const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
  });
  if (!res.ok) return -1;
  const data = await res.json();
  // data.data.limit and data.data.usage in USD
  const limit = data.data?.limit ?? 0;
  const usage = data.data?.usage ?? 0;
  return limit - usage;
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

    // Check balance before
    const balanceBefore = await getOpenRouterBalance();

    // Generate
    const generatedBase64 = await generatePetPortrait(base64, file.type, style, "openrouter", model, ratio);

    // Check balance after
    const balanceAfter = await getOpenRouterBalance();

    const cost = balanceBefore >= 0 && balanceAfter >= 0 ? balanceBefore - balanceAfter : -1;

    return NextResponse.json({
      image: `data:image/png;base64,${generatedBase64}`,
      balanceBefore: balanceBefore >= 0 ? balanceBefore.toFixed(4) : "N/A",
      balanceAfter: balanceAfter >= 0 ? balanceAfter.toFixed(4) : "N/A",
      cost: cost >= 0 ? cost.toFixed(4) : "N/A",
    });
  } catch (error) {
    console.error("Test generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
