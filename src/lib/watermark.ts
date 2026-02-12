import sharp from "sharp";

export async function applyWatermark(
  imageBuffer: Buffer
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  // Create SVG watermark with diagonal repeated text
  const fontSize = Math.round(width * 0.06);
  const watermarkSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .watermark {
            font-family: serif;
            font-size: ${fontSize}px;
            font-weight: 900;
            fill: rgba(255, 255, 255, 0.15);
            letter-spacing: 0.15em;
          }
        </style>
      </defs>
      <g transform="rotate(-30, ${width / 2}, ${height / 2})">
        ${Array.from({ length: 8 }, (_, i) =>
          Array.from(
            { length: 3 },
            (_, j) =>
              `<text x="${j * width * 0.5 - width * 0.2}" y="${
                i * height * 0.18 - height * 0.1
              }" class="watermark">FOTOFOCINHO</text>`
          ).join("")
        ).join("")}
      </g>
    </svg>
  `;

  const watermarkBuffer = Buffer.from(watermarkSvg);

  const result = await image
    .composite([
      {
        input: watermarkBuffer,
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

export async function removeWatermark(
  originalImageBuffer: Buffer
): Promise<Buffer> {
  // The "clean" version is simply the original generated image without watermark
  // We store both versions in Supabase - this function just ensures proper format
  return sharp(originalImageBuffer).jpeg({ quality: 95 }).toBuffer();
}
