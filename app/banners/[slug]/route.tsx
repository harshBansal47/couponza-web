import { ImageResponse } from "next/og";
import { resilient } from "@/lib/api";

export const revalidate = 3600;

// Deterministic per-store colours, so each store gets its own poster without
// anyone designing one. Pairs are chosen to keep white text readable.
const PALETTES: [string, string, string][] = [
  ["#4338ca", "#9b4dff", "#ffc933"],
  ["#ea580c", "#ec4899", "#ffe28a"],
  ["#0f766e", "#2563eb", "#a7f3d0"],
  ["#7c3aed", "#db2777", "#fde68a"],
  ["#1d4ed8", "#0891b2", "#fcd34d"],
  ["#be185d", "#f97316", "#fff3b0"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Wide poster behind store and coupon headers. Pure shapes plus a faint giant
 * store name, so the page's real <h1> stays the readable one. No font fetches:
 * Satori's built-in font is used, so this works offline and never blocks.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await resilient.getStoreBySlug(slug).catch(() => null);
  const name = (store?.name ?? "Couponbase").slice(0, 14);
  const [a, b, accent] = PALETTES[hash(slug) % PALETTES.length];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundImage: `linear-gradient(120deg, ${a}, ${b})`,
        }}
      >
        <div style={{ display: "flex", position: "absolute", left: -90, top: -140, width: 380, height: 380, borderRadius: 380, backgroundColor: "rgba(255,255,255,0.13)" }} />
        <div style={{ display: "flex", position: "absolute", left: 520, bottom: -170, width: 360, height: 360, borderRadius: 360, backgroundColor: accent, opacity: 0.28 }} />
        <div style={{ display: "flex", position: "absolute", right: 150, top: 40, width: 90, height: 90, borderRadius: 90, border: "10px solid rgba(255,255,255,0.35)" }} />
        <div style={{ display: "flex", position: "absolute", left: 330, top: 200, width: 56, height: 56, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.22)" }} />
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: 60,
            top: 70,
            fontSize: 190,
            fontWeight: 800,
            color: "rgba(255,255,255,0.16)",
            letterSpacing: -6,
          }}
        >
          {name}
        </div>
      </div>
    ),
    { width: 1200, height: 300 },
  );
}
