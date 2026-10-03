import type { Metadata } from "next";
import { displayName, getSessionUser } from "@/lib/session";
import { Bricolage_Grotesque, IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromoStrip from "@/components/PromoStrip";
import ToastProvider from "@/components/ui/Toast";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const code = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-code",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_TITLE = "Couponza — deals verified by people, not paid placement";
const SITE_DESCRIPTION =
  "Every code on Couponza is community-confirmed, and every commission we earn is disclosed on the page. No hidden placement, no scraped listings.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Couponza",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Couponza",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const NAV_LINKS = [
  { href: "/coupons", label: "Coupons" },
  { href: "/deals", label: "Deals" },
  { href: "/stores", label: "Stores" },
  { href: "/categories", label: "Categories" },
  { href: "/trust", label: "How this works" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-rendered so the header shows the signed-in name without waiting on
  // the client. Failures here must not take the whole page down, so a bad
  // session cookie just means an anonymous header.
  const user = await getSessionUser().catch(() => null);

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${code.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ToastProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
          >
            Skip to content
          </a>
          <PromoStrip />
          <Header links={NAV_LINKS} user={user ? { name: displayName(user) } : null} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
