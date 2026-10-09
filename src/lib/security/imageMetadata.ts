/**
 * Finds and removes hidden metadata in PNG and WebP files.
 *
 * Why: a Canva export of the ThrowAirI logo carried the owner's real full name,
 * Canva user id and Facebook id inside the file. Images are served publicly and
 * the code is meant to be published, so no committed image may carry metadata.
 * Only the chunks needed to draw the picture (and its colour profile) are kept.
 */
import fs from "node:fs";
import path from "node:path";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** PNG chunks that describe the image itself; everything else (tEXt, iTXt, zTXt, eXIf, tIME, caBX…) is metadata. */
const PNG_KEEP = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "gAMA", "cHRM", "sRGB", "iCCP", "sBIT", "pHYs", "bKGD", "acTL", "fcTL", "fdAT"]);

/** WebP chunks that carry metadata. */
const WEBP_DROP = new Set(["EXIF", "XMP "]);

const isPng = (b: Buffer) => b.length >= 8 && b.subarray(0, 8).equals(PNG_SIGNATURE);
const isWebp = (b: Buffer) => b.length >= 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP";

function pngChunks(b: Buffer): { type: string; bytes: Buffer }[] {
  const chunks = [];
  for (let i = 8; i + 12 <= b.length; ) {
    const len = b.readUInt32BE(i);
    chunks.push({ type: b.toString("latin1", i + 4, i + 8), bytes: b.subarray(i, i + 12 + len) });
    i += 12 + len;
  }
  return chunks;
}

function webpChunks(b: Buffer): { type: string; bytes: Buffer }[] {
  const chunks = [];
  for (let i = 12; i + 8 <= b.length; ) {
    const len = b.readUInt32LE(i + 4);
    const padded = len + (len % 2);
    chunks.push({ type: b.toString("latin1", i, i + 4), bytes: b.subarray(i, i + 8 + padded) });
    i += 8 + padded;
  }
  return chunks;
}

/** Names of the metadata chunks in an image; empty when it is clean or not a PNG/WebP. */
export function metadataChunks(b: Buffer): string[] {
  if (isPng(b)) return pngChunks(b).filter((c) => !PNG_KEEP.has(c.type)).map((c) => c.type);
  if (isWebp(b)) return webpChunks(b).filter((c) => WEBP_DROP.has(c.type)).map((c) => c.type.trim());
  return [];
}

/** The same image with every metadata chunk removed. Pixels are untouched. */
export function stripMetadata(b: Buffer): Buffer {
  if (isPng(b)) {
    return Buffer.concat([PNG_SIGNATURE, ...pngChunks(b).filter((c) => PNG_KEEP.has(c.type)).map((c) => c.bytes)]);
  }
  if (isWebp(b)) {
    const kept = webpChunks(b)
      .filter((c) => !WEBP_DROP.has(c.type))
      .map((c) => {
        if (c.type !== "VP8X") return c.bytes;
        // The extended header announces EXIF (bit 3) and XMP (bit 2); clear both flags.
        const copy = Buffer.from(c.bytes);
        copy[8] &= ~0b0000_1100;
        return copy;
      });
    const body = Buffer.concat(kept);
    const header = Buffer.alloc(12);
    header.write("RIFF", 0, "latin1");
    header.writeUInt32LE(body.length + 4, 4);
    header.write("WEBP", 8, "latin1");
    return Buffer.concat([header, body]);
  }
  return b;
}

const IMAGE_DIRS = ["public", "Image", "src/app"];
const IMAGE_EXT = /\.(png|webp)$/i;

/** Every PNG/WebP under the folders that hold committed images. */
export function listRepoImages(root: string = process.cwd()): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (IMAGE_EXT.test(entry.name)) out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  };
  for (const d of IMAGE_DIRS) walk(path.join(root, d));
  return out.sort();
}
