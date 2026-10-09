/**
 * Removes hidden metadata (author name, Canva/Facebook ids, EXIF, XMP, C2PA
 * content credentials, timestamps) from PNG and WebP files, without touching
 * the pixels. Design tools write the account holder's real name into exports,
 * so run this on every new image before committing it:
 *
 *   npx tsx scripts/strip-image-metadata.ts public/logos/new-logo.png
 *   npx tsx scripts/strip-image-metadata.ts            # every image in the repo
 *
 * src/lib/security/imageMetadata.test.ts fails while any image still has metadata.
 */
import fs from "node:fs";
import { listRepoImages, metadataChunks, stripMetadata } from "../src/lib/security/imageMetadata";

const files = process.argv.length > 2 ? process.argv.slice(2) : listRepoImages();
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file);
  const found = metadataChunks(before);
  if (found.length === 0) continue;
  const after = stripMetadata(before);
  fs.writeFileSync(file, after);
  changed++;
  console.log(`${file}: removed ${found.join(", ")} (${before.length} -> ${after.length} bytes)`);
}
console.log(`${changed} of ${files.length} file(s) cleaned.`);
