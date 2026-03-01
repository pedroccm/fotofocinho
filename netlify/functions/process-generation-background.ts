import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const AIML_API_KEY = process.env.AIML_API_KEY!;

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

async function generateWithAiml(imageBase64: string, mimeType: string, prompt: string): Promise<string> {
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const response = await fetch("https://api.aimlapi.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIML_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-edit",
      image_urls: [dataUrl],
      prompt,
      num_images: 1,
      aspect_ratio: "4:5",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AIML API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (result.data?.[0]?.b64_json) {
    return result.data[0].b64_json;
  }

  if (result.data?.[0]?.url) {
    const imageUrl = result.data[0].url;
    console.log(`Downloading generated image from: ${imageUrl.substring(0, 100)}...`);
    const imageResponse = await fetch(imageUrl);
    const contentType = imageResponse.headers.get("content-type") || "unknown";
    console.log(`Image response: status=${imageResponse.status}, content-type=${contentType}, size=${imageResponse.headers.get("content-length")}`);
    const imageBuffer = await imageResponse.arrayBuffer();
    const rawBuffer = Buffer.from(imageBuffer);
    console.log(`Raw buffer size: ${rawBuffer.length}, first bytes: ${rawBuffer.slice(0, 16).toString("hex")}`);
    // Normalize to JPEG using sharp (API may return various formats)
    const jpegBuffer = await sharp(rawBuffer).jpeg({ quality: 95 }).toBuffer();
    return jpegBuffer.toString("base64");
  }

  throw new Error(`No image in AIML response. Keys: ${JSON.stringify(Object.keys(result.data?.[0] || {}))}`);
}

async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 1000;

  const fontSize = Math.max(Math.round(width * 0.035), 14);
  const text = "fotofocinho";
  const spacing = fontSize * 12;

  const lines: string[] = [];
  for (let y = -spacing; y < height + spacing; y += spacing) {
    for (let x = -spacing; x < width + spacing; x += spacing) {
      lines.push(
        `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold" fill="white" fill-opacity="0.25" transform="rotate(-30, ${x}, ${y})">${text}</text>`
      );
    }
  }

  const svgOverlay = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${lines.join("")}</svg>`
  );

  return image
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

export const handler: Handler = async (event) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { generationId, style, originalPath, mimeType } = JSON.parse(event.body || "{}");

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

    // 2. Generate portrait with AI
    console.log("Step 2: Generating with AIML...");
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.renaissance;
    const prompt = `${stylePrompt}\n\n${BASE_PROMPT}`;
    const generatedBase64 = await generateWithAiml(base64, mimeType, prompt);
    const generatedBuffer = Buffer.from(generatedBase64, "base64");
    console.log(`Step 2 done. Generated image size: ${generatedBuffer.length} bytes`);

    // 3. Apply watermark
    console.log("Step 3: Applying watermark...");
    const watermarkedBuffer = await applyWatermark(generatedBuffer);
    console.log(`Step 3 done. Watermarked size: ${watermarkedBuffer.length} bytes`);

    // 4. Upload clean version
    console.log("Step 4: Uploading clean version...");
    const generatedPath = `${generationId}/clean.jpg`;
    const { error: uploadCleanErr } = await supabase.storage
      .from("generated")
      .upload(generatedPath, generatedBuffer, { contentType: "image/jpeg", upsert: false });
    if (uploadCleanErr) throw new Error(`Step 4 failed - upload clean: ${uploadCleanErr.message}`);
    console.log("Step 4 done.");

    // 5. Upload watermarked version
    console.log("Step 5: Uploading watermarked version...");
    const watermarkedPath = `${generationId}/preview.jpg`;
    const { error: uploadWmErr } = await supabase.storage
      .from("watermarked")
      .upload(watermarkedPath, watermarkedBuffer, { contentType: "image/jpeg", upsert: false });
    if (uploadWmErr) throw new Error(`Step 5 failed - upload watermarked: ${uploadWmErr.message}`);

    // 6. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("watermarked")
      .getPublicUrl(watermarkedPath);

    // 7. Update record
    await supabase
      .from("pets_generations")
      .update({
        status: "completed",
        generated_image_path: generatedPath,
        watermarked_image_path: watermarkedPath,
      })
      .eq("id", generationId);

    console.log(`Generation ${generationId} completed: ${publicUrlData.publicUrl}`);
    return { statusCode: 200 };
  } catch (error) {
    const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    console.error("Background generation error:", errorMessage);

    // Try to update the record status to failed with error details
    try {
      const { generationId } = JSON.parse(event.body || "{}");
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
