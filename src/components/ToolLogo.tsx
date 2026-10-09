import Image from "next/image";
import manifest from "@/lib/data/logoManifest.json";

const LOGOS = manifest as Record<string, string>;

// A fixed palette so a tool without a logo always gets the same colour.
const TILE_COLORS = ["#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706", "#db2777", "#4f46e5"];
const colorFor = (id: string) => TILE_COLORS[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % TILE_COLORS.length];

/**
 * The tool's own site icon (downloaded from its vendor, see docs/logo-sources.json), on a light
 * tile so dark icons stay visible on the dark theme. Tools without an icon get an initial.
 * Logos are the trademarks of their owners and only identify the product.
 */
export function ToolLogo({ id, name, size = 40 }: { id: string; name: string; size?: number }) {
  const src = LOGOS[id];
  const box = { width: size, height: size };
  if (!src) {
    return (
      <span
        aria-hidden
        style={{ ...box, backgroundColor: colorFor(id), fontSize: size * 0.45 }}
        className="inline-flex flex-none items-center justify-center rounded-xl font-bold text-white"
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }
  const inner = Math.round(size * 0.72);
  return (
    <span
      style={box}
      className="inline-flex flex-none items-center justify-center overflow-hidden rounded-xl bg-white/95"
    >
      <Image src={src} alt="" width={inner} height={inner} unoptimized style={{ width: inner, height: inner, objectFit: "contain" }} />
    </span>
  );
}
