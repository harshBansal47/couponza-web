import { ImageResponse } from "next/og";
import { ApiError, resilient } from "@/lib/api";
import { formatDiscount, successRateLabel } from "@/lib/format";
import { loadOgFonts } from "@/lib/og-fonts";

export const alt = "A Couponza deal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f7f6f1";
const INK = "#22261f";
const INK_SOFT = "#565c4e";
const VERIFIED = "#1f6f4a";
const LEDGER_LINE = "#d8d4c6";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fonts = await loadOgFonts();

  let title = "A Couponza deal";
  let storeName = "";
  let discount = "";
  let rate: string | null = null;

  try {
    const coupon = await resilient.getCouponBySlug(slug);
    if (!coupon) throw new ApiError("Coupon not found", 404);
    const store = await resilient.getStoreById(coupon.store_id);
    title = coupon.title;
    storeName = store?.name ?? "";
    discount = formatDiscount(coupon);
    rate = successRateLabel(coupon);
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 404)) throw err;
    // 404 case: fall through and render a generic branded card instead of crashing the share preview.
  }

  const serif = fonts.find((f) => f.name === "Fraunces")?.name ?? "serif";
  const sans = fonts.find((f) => f.name === "IBM Plex Sans")?.name ?? "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          padding: 64,
          fontFamily: sans,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", fontFamily: serif, fontSize: 32, color: INK }}>
            Couponza
          </div>
          {rate && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 140,
                height: 140,
                borderRadius: "50%",
                border: `4px solid ${VERIFIED}`,
                color: VERIFIED,
                fontSize: 28,
                fontWeight: 700,
                transform: "rotate(-8deg)",
                textAlign: "center",
              }}
            >
              {rate}
              {"\nverified"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          {storeName && (
            <div style={{ display: "flex", fontSize: 28, color: INK_SOFT, marginBottom: 12 }}>
              {storeName}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontFamily: serif,
              fontSize: 56,
              lineHeight: 1.15,
              color: INK,
            }}
          >
            {title}
          </div>
          {discount && (
            <div style={{ display: "flex", fontSize: 32, color: VERIFIED, marginTop: 20 }}>
              {discount}
            </div>
          )}
        </div>

        <div style={{ display: "flex", borderTop: `2px solid ${LEDGER_LINE}`, paddingTop: 24 }}>
          <div style={{ display: "flex", fontSize: 22, color: INK_SOFT }}>
            Verified by people, not by whoever paid the most.
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined },
  );
}
