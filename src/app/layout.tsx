import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ClientScripts from "@/components/client-scripts";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ToolBox Pro - 75+ Free Online Tools | PDF, Image, Business & More",
  description:
    "75+ free online tools — merge PDF, compress PDF, convert files, generate QR codes, calculate loans, resize images, and more. No signup, no limits, works entirely in your browser.",
  keywords: [
    "free online tools",
    "PDF merger",
    "PDF splitter",
    "PDF compressor",
    "PDF to Word",
    "PDF to JPG",
    "Word to PDF",
    "Excel to PDF",
    "PPT to PDF",
    "image resizer",
    "image compressor",
    "image cropper",
    "QR code generator",
    "barcode generator",
    "invoice generator",
    "password generator",
    "JSON formatter",
    "unit converter",
    "currency converter",
    "BMI calculator",
    "loan calculator",
    "percentage calculator",
    "tip calculator",
    "age calculator",
    "word counter",
    "character counter",
    "case converter",
    "base64 encoder",
    "URL encoder",
    "regex tester",
    "cron expression builder",
    "UUID generator",
    "hash generator",
    "color picker",
    "CSS gradient generator",
    "markdown preview",
    "stopwatch",
    "countdown timer",
    "Pomodoro timer",
    "world clock",
    "timezone converter",
    "text to handwriting",
    "binary converter",
    "Morse code translator",
    "calorie calculator",
    "budget planner",
    "tax calculator",
    "ROI calculator",
    "compound interest calculator",
    "habit tracker",
    "sleep calculator",
    "body fat calculator",
    "savings goal calculator",
  ],
  authors: [{ name: "ToolBox Pro" }],
  creator: "ToolBox Pro",
  publisher: "ToolBox Pro",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧰</text></svg>",
  },
  openGraph: {
    title: "ToolBox Pro - 75+ Free Online Tools",
    description: "Merge PDF, compress images, generate QR codes, calculate loans, and 70+ more free tools. No signup, works in your browser.",
    type: "website",
    siteName: "ToolBox Pro",
    locale: "en_US",
    url: "https://toolboxprobeta.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolBox Pro - 75+ Free Online Tools",
    description: "Merge PDF, compress images, generate QR codes, and 70+ more free tools. No signup required.",
  },
  alternates: {
    canonical: "https://toolboxprobeta.vercel.app",
  },
  verification: {
    google: "X82oiRNgii-6OFDdU7V-mINPdVhu4hzATe7YECpTdY4",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ToolBox Pro",
  description: "75+ free online tools for PDF management, image editing, business productivity, developer utilities, and everyday tasks. No signup required.",
  url: "https://toolboxprobeta.vercel.app",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "PDF Merge, Split, Compress, Convert",
    "Image Resize, Compress, Crop, Convert",
    "QR Code & Barcode Generator",
    "Invoice & Business Calculators",
    "Password, UUID & Hash Generators",
    "JSON Formatter & Code Tools",
    "Unit & Currency Converter",
    "Health & Fitness Calculators",
    "Text & Writing Tools",
    "Timer & Productivity Tools",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://toolboxprobeta.vercel.app" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="google-adsense-account" content="ca-pub-8159344073070790" />
        <meta name="google-site-verification" content="X82oiRNgii-6OFDdU7V-mINPdVhu4hzATe7YECpTdY4" />
        <meta name="msvalidate.01" content="9A91AF426618C908B9B9BAB8E1F59106" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8159344073070790"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
        <Analytics />
        <ClientScripts />
      </body>
    </html>
  );
}
