const fs = require("fs");
const path = require("path");

const AIML_API_KEY = "a2c4457ed6a14299a425dd670e5a8ad0";

const STYLE_PROMPTS = {
  renaissance:
    "Transform this pet photo into a majestic Renaissance oil painting portrait. The pet should be dressed as a noble aristocrat wearing ornate royal garments with rich velvet and gold embroidery. Seated on a luxurious velvet cushion with gold tassels. Dramatic Rembrandt lighting with a rich dark background. Museum-quality fine art style reminiscent of 16th century Italian masters. Highly detailed fur texture blended seamlessly with the clothing. Warm golden tones.",
  baroque:
    "Transform this pet photo into an opulent Baroque-era portrait painting. The pet should be dressed as a wealthy merchant prince wearing extravagant silk robes with lace collar and jeweled accessories. Dramatic chiaroscuro lighting in the style of Caravaggio. Rich, dark velvet background with a hint of draped curtain. Gilt frame worthy composition. Lavish detail in fabrics and textures.",
  victorian:
    "Transform this pet photo into a distinguished Victorian-era portrait. The pet should be dressed as a proper British aristocrat wearing a fitted waistcoat, cravat, and top hat or bonnet. Seated in an ornate wingback chair. Soft, refined lighting. Muted earth tones with deep greens and burgundy. Prim and proper pose. Style of John Singer Sargent.",
  military:
    "Transform this pet photo into a heroic military commander portrait. The pet should be dressed in a decorated military uniform with gold epaulettes, medals, and a sash of honor. Standing proudly with a sword or near a battlefield map. Dramatic lighting with smoke in the background. Style of Jacques-Louis David's Napoleon paintings. Bold, commanding presence.",
  royal:
    "Transform this pet photo into a regal royal court portrait. The pet should be wearing a crown or tiara, draped in an ermine-trimmed royal cape with a jeweled brooch. Seated on an ornate golden throne. Majestic red velvet curtains in the background. Style of Hyacinthe Rigaud's portrait of Louis XIV. Ultimate luxury and grandeur.",
  admiral:
    "Transform this pet photo into a distinguished naval admiral portrait. The pet should be dressed in a navy blue admiral's coat with gold braiding, brass buttons, and a bicorn hat. Standing on the deck of a ship with the sea in the background. Dramatic sky. Style of 18th century British naval portraiture. Dignified and commanding.",
};

const STYLES = Object.keys(STYLE_PROMPTS);

async function generateImage(imageBase64, mimeType, style) {
  const prompt = STYLE_PROMPTS[style];
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  console.log(`  Calling AIML API for style: ${style}...`);

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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AIML API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (result.data?.[0]?.url) {
    const imageResponse = await fetch(result.data[0].url);
    const imageBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(imageBuffer);
  }

  throw new Error("No image generated in response");
}

async function processImage(imagePath, outputDir) {
  const imageName = path.basename(imagePath, path.extname(imagePath));
  const imageOutputDir = path.join(outputDir, imageName);

  // Create output directory
  if (!fs.existsSync(imageOutputDir)) {
    fs.mkdirSync(imageOutputDir, { recursive: true });
  }

  // Read image
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

  console.log(`\nProcessing: ${imageName}`);

  for (const style of STYLES) {
    const outputPath = path.join(imageOutputDir, `${style}.jpg`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`  [SKIP] ${style} already exists`);
      continue;
    }

    try {
      const resultBuffer = await generateImage(imageBase64, mimeType, style);
      fs.writeFileSync(outputPath, resultBuffer);
      console.log(`  [OK] ${style} saved`);

      // Wait 2s between requests to avoid rate limiting
      await new Promise((r) => setTimeout(r, 2000));
    } catch (error) {
      console.error(`  [ERROR] ${style}: ${error.message}`);
    }
  }
}

async function main() {
  const samplesDir = path.join(__dirname, "..", "samples");
  const outputDir = path.join(samplesDir, "output");

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all images
  const images = fs
    .readdirSync(samplesDir)
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
    .map((f) => path.join(samplesDir, f));

  console.log(`Found ${images.length} images`);
  console.log(`Styles: ${STYLES.join(", ")}`);
  console.log(`Total generations: ${images.length * STYLES.length}`);
  console.log(`Output directory: ${outputDir}\n`);

  for (const imagePath of images) {
    await processImage(imagePath, outputDir);
  }

  console.log("\n Done!");
}

main().catch(console.error);
