// Regenerate app logos + favicons from logo.png.
// Run: node packages/assets/generate-icons.mjs
// Needs sharp (comes with Next.js): pnpm --filter catalogue exec node ../../packages/assets/generate-icons.mjs
import { createRequire } from "node:module";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = resolve(root, "packages/assets/logo.png");
const APPS = ["apps/catalogue", "apps/project-management"];

// ponytail: the "M" is the first 21% of the trimmed wordmark. Re-tune if the
// logo art changes; trim() on the slice fixes small errors either way.
const MARK_RATIO = 0.21;

/** Minimal ICO container wrapping PNG entries. Valid in every browser since IE11. */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + entries.length * 16;
  const dirs = entries.map(({ size, data }) => {
    const d = Buffer.alloc(16);
    d.writeUInt8(size >= 256 ? 0 : size, 0);
    d.writeUInt8(size >= 256 ? 0 : size, 1);
    d.writeUInt16LE(1, 4);
    d.writeUInt16LE(32, 6);
    d.writeUInt32LE(data.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += data.length;
    return d;
  });
  return Buffer.concat([header, ...dirs, ...entries.map((e) => e.data)]);
}

const square = (buf, size, pad = 0) =>
  sharp(buf)
    .resize({
      width: size - pad * 2,
      height: size - pad * 2,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

const wordmark = await sharp(SRC).trim().png().toBuffer();
const { width, height } = await sharp(wordmark).metadata();
const mark = await sharp(wordmark)
  .extract({ left: 0, top: 0, width: Math.round(width * MARK_RATIO), height })
  .trim()
  .png()
  .toBuffer();

for (const app of APPS) {
  const pub = resolve(root, app, "public");
  const appDir = resolve(root, app, "app");
  await mkdir(pub, { recursive: true });

  await writeFile(resolve(pub, "logo.png"), await sharp(wordmark).resize({ height: 96 }).png().toBuffer());
  await writeFile(resolve(pub, "logo-mark.png"), await square(mark, 512, 24));

  // Next.js App Router auto-wires these into <head>. No metadata edits needed.
  await writeFile(resolve(appDir, "icon.png"), await square(mark, 512, 24));
  await writeFile(resolve(appDir, "apple-icon.png"), await square(mark, 180, 14));
  await writeFile(
    resolve(appDir, "favicon.ico"),
    ico(await Promise.all([16, 32, 48].map(async (s) => ({ size: s, data: await square(mark, s, s >= 32 ? 2 : 1) })))),
  );
  console.log("wrote", app);
}
