import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { listRepoImages, metadataChunks, stripMetadata } from "./imageMetadata";

test("no committed image carries hidden metadata (author name, account ids, EXIF, XMP)", () => {
  const images = listRepoImages();
  assert.ok(images.length > 0, "expected to find images under public/, Image/ and src/app/");
  const dirty = images
    .map((f) => ({ f, chunks: metadataChunks(fs.readFileSync(f)) }))
    .filter((x) => x.chunks.length > 0)
    .map((x) => `${x.f}: ${x.chunks.join(", ")}`);
  assert.deepEqual(dirty, [], "run: npx tsx scripts/strip-image-metadata.ts");
});

test("stripMetadata removes a PNG text chunk and keeps the image chunks", () => {
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    return Buffer.concat([len, Buffer.from(type, "latin1"), data, Buffer.alloc(4)]);
  };
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const png = Buffer.concat([
    sig,
    chunk("IHDR", Buffer.alloc(13)),
    chunk("tEXt", Buffer.from("Author\0Someone Real", "latin1")),
    chunk("IDAT", Buffer.alloc(4)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  assert.deepEqual(metadataChunks(png), ["tEXt"]);
  const clean = stripMetadata(png);
  assert.deepEqual(metadataChunks(clean), []);
  assert.ok(!clean.toString("latin1").includes("Someone Real"));
  assert.equal(clean.length, png.length - (12 + "Author\0Someone Real".length));
});
