import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const MODEL = "google/gemini-3.1-flash-image-preview";

const BASE_PROMPT = `Formal portrait of a PET transformed into a noble figure from a classic gallery. The image must convey grandeur, serenity, and timelessness. The animal occupies a central position, seated or slightly in three-quarter view, with a direct or subtly averted gaze, evoking silent authority. The attire must dialogue with the chosen period (Renaissance, Baroque, or Victorian), with textile richness and refined ornamental detailing.

Lighting: Soft lateral key light at 45°, warm temperature between 3200K–4200K. Subtle fill with a golden reflector to preserve fur texture. Slight backlight to highlight the silhouette and separate from the background. Dense shadows with smooth transitions. Camera: ARRI Alexa 35. Lens: 85mm or 100mm vintage prime. Aperture: f/2.8. ISO: 400. Shutter angle: 180°. Frame rate: 24fps. Grip: fixed tripod or static dolly. Diffusion: light frontal silk to soften texture.

Background: Palatial interior or textured neutral with atmospheric depth. Heavy curtains, columns, dark library, or wall with aged painting. Blurred background with slight pictorial grain, simulating oil on canvas. Controlled depth with soft vignette on edges.

Composition: Central symmetrical grid with wide margins. Dominant vertical axis. Rule of thirds applied to the animal's gaze. Negative space below for typography. Balance between dark mass (background) and light mass (face and collar). 4:5 vertical proportion.

Aesthetic reference: Pictorial realism with historical theatricality and classical gravity. No visible modern elements. No caricatural humor. Palette restricted to earthy tones, golds, deep greens, and wine red. Texture simulating oil painting.`;

const STYLE_PROMPTS: Record<string, string> = {
  renaissance:
    "Create an image representing a classic portrait of a PET in Renaissance aesthetics, with a white lace collar, deep velvet tunic, central golden medallion, balanced composition, serene expression, architectural background with columns and diffused landscape. Soft lighting, moderate contrast, and harmonious atmosphere.",
  baroque:
    "Create an image representing a classic portrait of a PET in Baroque aesthetics, with luxurious fabrics, golden embroidery, intense light and shadow contrast, dramatic dark background with heavy red curtains. Lighting with accentuated chiaroscuro and punctual shine on metals and jewels. Theatrical and haughty expression.",
  victorian:
    "Create an image representing a classic portrait of a PET in Victorian aesthetics, wearing a structured waistcoat, antique brooch, top hat or elegant bow. Velvet-upholstered armchair, library in the background. Soft and melancholic lighting, introspective aristocratic atmosphere.",
};

async function generateWithOpenRouter(imageBase64: string, mimeType: string, prompt: string): Promise<Buffer> {
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      modalities: ["image", "text"],
      image_config: { aspect_ratio: "4:5" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // Format: choices[0].message.images[0].image_url.url (data URL)
  const images = result.choices?.[0]?.message?.images;
  if (images?.[0]?.image_url?.url) {
    const imgUrl: string = images[0].image_url.url;
    const b64 = imgUrl.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(b64, "base64");
  }

  // Fallback: content array with image parts
  const content = result.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url" && part.image_url?.url) {
        const b64 = part.image_url.url.replace(/^data:image\/\w+;base64,/, "");
        return Buffer.from(b64, "base64");
      }
    }
  }

  throw new Error(`No image in OpenRouter response. Keys: ${JSON.stringify(Object.keys(result.choices?.[0]?.message || {}))}`);
}

export const handler: Handler = async (event) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let generationId: string | undefined;

  try {
    const body = JSON.parse(event.body || "{}");
    generationId = body.generationId;
    const { style, originalPath, mimeType } = body;

    if (!generationId || !originalPath) {
      console.error("Missing required fields");
      return { statusCode: 400 };
    }

    console.log(`Processing generation ${generationId}...`);

    // 1. Download original from Supabase Storage
    console.log("Step 1: Downloading original...");
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("originals")
      .download(originalPath);

    if (downloadError || !fileData) {
      throw new Error(`Step 1 failed - download original: ${downloadError?.message}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const base64 = buffer.toString("base64");
    console.log(`Step 1 done. Image size: ${buffer.length} bytes`);

    // 2. Generate portrait with OpenRouter (returns base64 inline, no URL download needed)
    console.log("Step 2: Generating with OpenRouter...");
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.renaissance;
    const prompt = `${stylePrompt}\n\n${BASE_PROMPT}`;
    const generatedBuffer = await generateWithOpenRouter(base64, mimeType, prompt);
    console.log(`Step 2 done. Generated image size: ${generatedBuffer.length} bytes`);

    // Detect content type from magic bytes
    const isJpeg = generatedBuffer[0] === 0xFF && generatedBuffer[1] === 0xD8;
    const isPng = generatedBuffer[0] === 0x89 && generatedBuffer[1] === 0x50;
    const detectedType = isJpeg ? "image/jpeg" : isPng ? "image/png" : "image/png";
    const ext = isJpeg ? "jpg" : "png";

    // 3. Upload clean version
    console.log("Step 3: Uploading clean version...");
    const generatedPath = `${generationId}/clean.${ext}`;
    const { error: uploadCleanErr } = await supabase.storage
      .from("generated")
      .upload(generatedPath, generatedBuffer, { contentType: detectedType, upsert: false });
    if (uploadCleanErr) throw new Error(`Step 3 failed - upload clean: ${uploadCleanErr.message}`);

    // 4. Upload same as preview (watermark to be added later)
    console.log("Step 4: Uploading preview...");
    const watermarkedPath = `${generationId}/preview.${ext}`;
    const { error: uploadWmErr } = await supabase.storage
      .from("watermarked")
      .upload(watermarkedPath, generatedBuffer, { contentType: detectedType, upsert: false });
    if (uploadWmErr) throw new Error(`Step 4 failed - upload preview: ${uploadWmErr.message}`);

    // 5. Update record
    await supabase
      .from("pets_generations")
      .update({
        status: "completed",
        generated_image_path: generatedPath,
        watermarked_image_path: watermarkedPath,
      })
      .eq("id", generationId);

    console.log(`Generation ${generationId} completed!`);
    return { statusCode: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    console.error("Background generation error:", errorMessage);

    try {
      if (generationId) {
        await supabase
          .from("pets_generations")
          .update({ status: "failed", error_message: errorMessage.substring(0, 1000) })
          .eq("id", generationId);
      }
    } catch (updateErr) {
      console.error("Failed to update error status:", updateErr);
    }

    return { statusCode: 500 };
  }
};
