import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public", "images", "og-image.webp");
const targets = [
  "og-home-1200x630.jpg",
  "og-sobre-1200x630.jpg",
  "og-processo-1200x630.jpg",
  "og-projetos-1200x630.jpg",
  "og-loja-1200x630.jpg",
  "og-arquitetura-1200x630.jpg",
  "og-engenharia-1200x630.jpg",
  "og-marcenaria-1200x630.jpg",
];

async function run() {
  if (!fs.existsSync(source)) {
    throw new Error(`Source image not found: ${source}`);
  }

  for (const file of targets) {
    const out = path.join(root, "public", file);
    try {
      const buffer = await sharp(source)
        .resize(1200, 630, { fit: "cover" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      await fs.promises.writeFile(out, buffer);
      console.log(`ok: public/${file}`);
    } catch (e) {
      console.warn(`[WARN] skipped ${file} due to sharp error on Vercel: ${e.message}`);
      // Skip failing file and proceed with the build.
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
