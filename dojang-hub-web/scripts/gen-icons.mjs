import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const svgPath = path.join(rootDir, "design", "icon-master.svg");
const outputDir = path.join(rootDir, "public", "icons");

async function generate() {
  await fs.mkdir(outputDir, { recursive: true });
  const svgBuffer = await fs.readFile(svgPath);

  // 1. icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDir, "icon-192.png"));
  console.log("Generated icon-192.png");

  // 2. icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, "icon-512.png"));
  console.log("Generated icon-512.png");

  // 3. apple-touch-icon-180.png
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, "apple-touch-icon-180.png"));
  console.log("Generated apple-touch-icon-180.png");

  // 4. icon-maskable-512.png (inner 80% safe zone, navy background)
  const innerSize = Math.round(512 * 0.8); // 410px
  const offset = Math.round((512 - innerSize) / 2); // 51px

  const innerResized = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: "#031636",
    },
  })
    .composite([
      {
        input: innerResized,
        top: offset,
        left: offset,
      },
    ])
    .png()
    .toFile(path.join(outputDir, "icon-maskable-512.png"));
  console.log("Generated icon-maskable-512.png");

  console.log("All icons successfully generated in public/icons/");
}

generate().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
