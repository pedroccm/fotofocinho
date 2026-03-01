import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

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

async function generateWithAiml(imageBase64: string, mimeType: string, prompt: string): Promise<Buffer> {
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
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AIML API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (result.data?.[0]?.b64_json) {
    return Buffer.from(result.data[0].b64_json, "base64");
  }

  if (result.data?.[0]?.url) {
    const imageUrl = result.data[0].url;
    console.log(`Downloading generated image from URL (first 100 chars): ${imageUrl.substring(0, 100)}`);

    // Retry up to 5 times with increasing delay (URL might not be ready immediately)
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const imageResponse = await fetch(imageUrl, {
          headers: { "Accept": "image/*,*/*" },
        });
        if (imageResponse.ok) {
          const contentType = imageResponse.headers.get("content-type") || "unknown";
          console.log(`Image download succeeded on attempt ${attempt}: content-type=${contentType}`);
          const arrayBuf = await imageResponse.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
        console.log(`Image download attempt ${attempt} failed: ${imageResponse.status} ${imageResponse.statusText}`);
        if (attempt < 5) {
          await new Promise(r => setTimeout(r, attempt * 3000)); // 3s, 6s, 9s, 12s
        }
      } catch (fetchErr) {
        console.log(`Image download attempt ${attempt} error: ${fetchErr}`);
        if (attempt < 5) {
          await new Promise(r => setTimeout(r, attempt * 3000));
        }
      }
    }
    throw new Error(`Image download failed after 5 attempts. URL: ${imageUrl.substring(0, 200)}`);
  }

  throw new Error(`No image in AIML response. Keys: ${JSON.stringify(Object.keys(result.data?.[0] || {}))}`);
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

    // 2. Generate portrait with AI
    console.log("Step 2: Generating with AIML...");
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.renaissance;
    const prompt = `${stylePrompt}\n\n${BASE_PROMPT}`;
    const generatedBuffer = await generateWithAiml(base64, mimeType, prompt);
    console.log(`Step 2 done. Generated image size: ${generatedBuffer.length} bytes`);

    // Detect content type from magic bytes
    const isJpeg = generatedBuffer[0] === 0xFF && generatedBuffer[1] === 0xD8;
    const isPng = generatedBuffer[0] === 0x89 && generatedBuffer[1] === 0x50;
    const isWebp = generatedBuffer[8] === 0x57 && generatedBuffer[9] === 0x45 && generatedBuffer[10] === 0x42 && generatedBuffer[11] === 0x50;
    const detectedType = isJpeg ? "image/jpeg" : isPng ? "image/png" : isWebp ? "image/webp" : "image/jpeg";
    const ext = isJpeg ? "jpg" : isPng ? "png" : isWebp ? "webp" : "jpg";
    console.log(`Detected image format: ${detectedType} (first bytes: ${generatedBuffer.slice(0, 4).toString("hex")})`);

    // 3. Upload clean version (the generated image as-is)
    console.log("Step 3: Uploading clean version...");
    const generatedPath = `${generationId}/clean.${ext}`;
    const { error: uploadCleanErr } = await supabase.storage
      .from("generated")
      .upload(generatedPath, generatedBuffer, { contentType: detectedType, upsert: false });
    if (uploadCleanErr) throw new Error(`Step 3 failed - upload clean: ${uploadCleanErr.message}`);
    console.log("Step 3 done.");

    // 4. Upload the same image as watermarked preview for now
    // (watermark will be applied client-side or via a separate service later)
    console.log("Step 4: Uploading preview version...");
    const watermarkedPath = `${generationId}/preview.${ext}`;
    const { error: uploadWmErr } = await supabase.storage
      .from("watermarked")
      .upload(watermarkedPath, generatedBuffer, { contentType: detectedType, upsert: false });
    if (uploadWmErr) throw new Error(`Step 4 failed - upload preview: ${uploadWmErr.message}`);

    // 5. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("watermarked")
      .getPublicUrl(watermarkedPath);

    // 6. Update record
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
