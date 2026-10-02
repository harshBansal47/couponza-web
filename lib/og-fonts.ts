// next/og's ImageResponse renders via Satori, a separate engine from the page
// renderer — it needs raw font bytes, not next/font. Fetching from Google
// Fonts at request time is the documented pattern (see Vercel's own
// og-image-examples repo): query the CSS2 stylesheet with a legacy
// User-Agent (modern browsers get WOFF2, which Satori can't parse; an old
// User-Agent gets plain TTF), then fetch the actual font file URL that
// stylesheet points to. If any of this fails (offline build environment, a
// CDN hiccup), every OG image route falls back to Satori's built-in font
// rather than throwing and breaking the share preview.
export interface LoadedFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal";
}

// An old Safari UA is the commonly-used trick to get TTF instead of WOFF2
// out of Google's CSS2 endpoint.
const LEGACY_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36";

async function fetchGoogleFont(
  family: string,
  weight: LoadedFont["weight"],
): Promise<LoadedFont | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
    const css = await (await fetch(cssUrl, { headers: { "User-Agent": LEGACY_USER_AGENT } })).text();
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
    if (!match) return null;

    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;

    return { name: family, data: await fontRes.arrayBuffer(), weight, style: "normal" };
  } catch {
    return null;
  }
}

export async function loadOgFonts(): Promise<LoadedFont[]> {
  const [fraunces, plexSans] = await Promise.all([
    fetchGoogleFont("Fraunces", 600),
    fetchGoogleFont("IBM Plex Sans", 400),
  ]);
  return [fraunces, plexSans].filter((f): f is LoadedFont => f !== null);
}
