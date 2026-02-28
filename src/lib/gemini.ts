const AIML_API_KEY = process.env.AIML_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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

export type Provider = "aiml" | "openrouter";

async function generateWithAiml(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  if (!AIML_API_KEY) {
    throw new Error("AIML_API_KEY is not configured");
  }

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  console.log("Calling AIML API with base64 image...");

  const response = await fetch("https://api.aimlapi.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIML_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-edit",
      image_urls: [dataUrl],
      prompt: prompt,
      num_images: 1,
      aspect_ratio: "4:5",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AIML API error:", errorText);
    throw new Error(`AIML API error: ${response.status}`);
  }

  const result = await response.json();
  console.log("AIML API response:", JSON.stringify(result, null, 2));

  if (result.data?.[0]?.url) {
    const imageResponse = await fetch(result.data[0].url);
    const imageBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(imageBuffer).toString("base64");
  }

  throw new Error("No image generated in AIML response");
}

export const OPENROUTER_MODELS = [
  { id: "google/gemini-3.1-flash-image-preview", name: "Gemini 3.1 Flash" },
] as const;

async function generateWithOpenRouter(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  model: string = OPENROUTER_MODELS[0].id
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  console.log(`Calling OpenRouter API with model: ${model}...`);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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
    console.error("OpenRouter API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const result = await response.json();
  console.log("OpenRouter response:", JSON.stringify(result, null, 2));

  // Format: choices[0].message.images[0].image_url.url
  const images = result.choices?.[0]?.message?.images;
  if (images?.[0]?.image_url?.url) {
    const imgUrl: string = images[0].image_url.url;
    return imgUrl.replace(/^data:image\/\w+;base64,/, "");
  }

  // Fallback: content array with image parts
  const content = result.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url" && part.image_url?.url) {
        return part.image_url.url.replace(/^data:image\/\w+;base64,/, "");
      }
    }
  }

  throw new Error("No image generated in OpenRouter response");
}

export async function generatePetPortrait(
  imageBase64: string,
  mimeType: string,
  style: string,
  provider: Provider = "aiml",
  model?: string
): Promise<string> {
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.renaissance;
  const prompt = `${stylePrompt}\n\n${BASE_PROMPT}`;

  if (provider === "openrouter") {
    return generateWithOpenRouter(imageBase64, mimeType, prompt, model || OPENROUTER_MODELS[0].id);
  }
  return generateWithAiml(imageBase64, mimeType, prompt);
}
