# Couponbase Web

The public frontend — a separate Next.js app that talks to the [Couponbase FastAPI
backend](../couponbase) over HTTP. Nothing here touches the database directly.

## Why this exists as a separate app

The backend already serves the JSON API and the `/admin` back office. This app is
the third piece: a fast, SEO-friendly, agent-legible public site, built to embody
three product bets (see the strategy discussion this came out of):

## SEO and design, completed this round

- **Structured data that's actually true, not SEO theater.** Every coupon page
  carries `AggregateRating` built from real "worked"/"didn't work" reports
  (`lib/seo.ts` — the mapping is documented in code: 100% success = 5 stars,
  0% = 1 star, linear between; zero reports = no rating shown, not a fake one),
  plus `BreadcrumbList` on every page and `WebSite`/`SearchAction` on the
  homepage (sitelinks search box eligibility). Google's structured-data
  guidelines require ratings to reflect genuine user feedback — ours does.
- **Dynamic OG images per coupon** (`app/coupons/[slug]/opengraph-image.tsx`,
  via `next/og`) — store name, title, discount, and a rotated "X% verified"
  stamp badge, rendered fresh from live data. This is the actual differentiator
  made visible the moment someone shares a link, not just metadata.
- **A dynamic favicon and app icon** (`app/icon.tsx`, `app/apple-icon.tsx`) — a
  simple "C" monogram in the same verified-green stamp style, not a generic
  coupon-tag icon.
- **Canonical URLs + OpenGraph/Twitter metadata** on every page, `metadataBase`
  set so relative image URLs resolve correctly.
- **Sitemap priority weighted by verification confidence** (`app/sitemap.ts`) —
  a coupon with many positive, recent reports ranks higher than an unverified
  one. Thematically consistent with the whole product, not just a flat list.
- **Pagination** (`components/Pagination.tsx`) on the homepage, category, and
  store listings — server-rendered Previous/Next links preserving search
  params, not a client-only "Load more" that search engines can't crawl.
- **Store logos actually render now** (`components/CouponRow.tsx`'s `StoreMark`)
  — a real `next/image` when `logo_url` is set, a monogram fallback when not.
  They were fetched since Phase 3 but never displayed until now.
- **39 frontend tests** (Vitest + React Testing Library): `lib/format.ts` and
  `lib/seo.ts`'s pure logic, plus `VerifyWidget`, `CouponCodePanel`, and
  `Pagination`'s interactive behavior — including the 429 rate-limit path and
  clipboard-API failure, not just the happy path. Run with `npm test`.

**A real bug this caught:** `next/og`'s renderer (Satori) crashes if you pass
`fontFamily: undefined` in a style object rather than omitting it or giving a
real fallback string — `next build` failed outright until fixed. Caught by
actually running the build, not by reasoning about the code.

**Known miss:** the verified-rate badge's `transform: rotate(-8deg)` doesn't
visibly apply in the rendered OG image — Satori likely doesn't support that
CSS property the way a browser would. Cosmetic only; the badge still renders
correctly, just not tilted as designed.

1. **Trust over urgency** — every commission is disclosed on the page itself, not
   buried in a footer. No countdown timers, no red "LIMITED TIME" badges.
2. **Community verification over scraped listings** — every coupon shows a real
   success rate from real "worked / didn't work" reports, not a static list.
3. **Agent-legible by default** — every coupon page carries schema.org JSON-LD,
   and `/sitemap.xml` is generated from live data, so AI shopping agents (and
   search engines) can cite accurate, current data instead of scraping guesses.

## Prerequisites

- Node.js 22+
- The backend running locally (see `../couponbase/README.md`) — `docker compose up`
  there, with at least one store/category/coupon created via `/admin` or the API.

## First run

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. `.env.local` points at `http://localhost:8000/api/v1`
by default — change `NEXT_PUBLIC_API_URL` if your backend runs elsewhere.

## Build for production

```bash
npm run build
npm run start
```

`next/font/google` fetches font files from Google at build time — that needs
outbound internet access. If you're building somewhere with restricted egress
(a locked-down CI runner, for instance), either allow `fonts.googleapis.com` /
`fonts.gstatic.com`, or switch `app/layout.tsx` to `next/font/local` with
self-hosted font files.

## What's here

| Path | Purpose |
|---|---|
| `lib/types.ts` | TypeScript types mirroring the backend's Pydantic schemas — kept in sync by hand |
| `lib/api.ts` | Typed fetch client for every public endpoint the backend exposes |
| `app/page.tsx` | Homepage: live example, search, category filter, listing |
| `app/coupons/[slug]/page.tsx` | Coupon detail: code reveal, verification, disclosure, JSON-LD |
| `app/stores/[slug]/page.tsx`, `app/categories/[slug]/page.tsx` | Filtered listings |
| `app/trust/page.tsx` | The trust pledge (hardcoded) + an optional CMS-editable extended policy |
| `app/sitemap.ts`, `app/robots.ts` | Generated from live backend data |
| `components/CouponCodePanel.tsx` | Client component: reveal/copy code + the `/go` redirect CTA |
| `components/VerifyWidget.tsx` | Client component: "worked / didn't work" reporting |
| `components/Pagination.tsx` | Server-rendered Previous/Next, preserves query params |
| `lib/seo.ts` | Canonical URLs, BreadcrumbList/AggregateRating JSON-LD builders |
| `lib/og-fonts.ts` | Google Fonts loader for OG images, with graceful fallback |
| `app/opengraph-image.tsx`, `app/coupons/[slug]/opengraph-image.tsx` | Dynamic social-share images |
| `app/icon.tsx`, `app/apple-icon.tsx` | Dynamic favicon/app icon |

## Design notes

- **Destination URLs are never in the JSON this app fetches.** The backend's
  public read endpoints deliberately omit `destination_url` (see the backend's
  Phase 5 changes) — the only way to reach a store is `GET /coupons/{id}/go`,
  which redirects server-side. This app links to that URL directly; it never
  has the raw destination to leak.
- **Verification is anonymous but rate-limited server-side** (one report per
  coupon per IP per 24h) — there's no login wall on reporting, since the whole
  point is maximizing how many people can vote a code up or down.
- **The homepage's store-name lookup fetches up to 100 stores** to label each
  row without an N+1 request per coupon. Fine at this scale; once you have
  meaningfully more than 100 stores, that should become a backend
  `?include=store` param on `/coupons` instead.
- **Toolchain note:** this was built and verified against `typescript@6.0.3`
  and `eslint@9.39.5`, not the very latest majors (TypeScript 7 and ESLint 10)
  — `typescript-eslint` and `eslint-config-next`'s bundled `eslint-plugin-react`
  don't support those yet as of this writing. Bumping either will likely break
  `npm run lint` until upstream catches up; check before upgrading.

## Next step

The backend now has an MCP server (`../couponbase/mcp_server`) completing priority
#3. Still genuinely open on the frontend: no user accounts/login UI (the
backend's auth is fully built but nothing here calls it yet), no browser
extension, and the homepage's store-name/logo lookup still fetches up to 100
stores per request rather than using a proper join — fine at current scale,
worth revisiting before it isn't.
