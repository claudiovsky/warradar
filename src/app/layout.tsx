import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://war-radar.com";
const SITE_NAME = "WAR-RADAR";
const SITE_DESCRIPTION =
  "Real-time interactive map tracking active wars and armed conflicts worldwide. AI-powered news analysis from 25+ sources with live severity indicators, casualty data, and historical context for every war zone.";
const SITE_TITLE = "WAR-RADAR — Global War Monitor | Live War Map & Armed Conflict Tracker";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0f" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // ── Core ──
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [
    "war map",
    "active wars",
    "live war radar",
    "global war monitor",
    "war zones map",
    "armed conflict tracker",
    "military conflicts",
    "civil war tracker",
    "war news",
    "real-time war data",
    "war monitor",
    "war casualties",
    "armed conflict map",
    "ongoing wars",
    "world wars today",
    "insurgency tracker",
    "military operations",
    "war zones live",
    "battlefield map",
    "global armed conflicts",
  ],
  authors: [{ name: "WAR-RADAR Team" }],
  creator: "WAR-RADAR",
  publisher: "WAR-RADAR",
  category: "News",

  // ── Robots ──
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph ──
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "WAR-RADAR — Global Conflict Monitor showing active war zones on interactive map",
        type: "image/png",
      },
    ],
  },

  // ── Twitter ──
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
    creator: "@warradar",
  },

  // ── Alternates ──
  alternates: {
    canonical: SITE_URL,
  },

  // ── Icons / Manifest ──
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  // ── Other ──
  other: {
    "google-site-verification": "-EqRq4L9OlzEYr0H2npibG-pbie4VFlPxlzB9URtzAw",
    "msvalidate.01": process.env.BING_SITE_VERIFICATION || "",
  },
};

// JSON-LD Structured Data
function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    alternateName: "WAR RADAR",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: "NewsApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "WAR-RADAR",
      url: SITE_URL,
    },
    image: `${SITE_URL}/opengraph-image`,
    screenshot: `${SITE_URL}/opengraph-image`,
    featureList: [
      "Real-time conflict zone tracking",
      "AI-powered news analysis",
      "Interactive world map with severity indicators",
      "Historical context for each conflict",
      "Multiple news source aggregation",
    ],
    keywords: "war map, conflict tracker, crisis monitor, live war zones, global security",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
        <link rel="preconnect" href="https://a.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://b.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://c.basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://unpkg.com" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
