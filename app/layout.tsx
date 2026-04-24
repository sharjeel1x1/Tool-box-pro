import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ToolBox Pro - Free Online PDF & Business Tools",
  description:
    "100 free online tools for PDF management, business productivity, and everyday utilities. Merge, split, compress PDFs, generate QR codes, convert files, calculate loans, and more — all in your browser, no signup required.",
  keywords: [
    "PDF tools", "merge PDF", "split PDF", "compress PDF", "QR code generator",
    "online tools", "free tools", "PDF converter", "invoice generator",
    "password generator", "JSON formatter", "unit converter",
  ],
  authors: [{ name: "ToolBox Pro" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧰</text></svg>",
  },
  openGraph: {
    title: "ToolBox Pro - Free Online PDF & Business Tools",
    description: "100 free online tools for PDF, business, and everyday tasks. No signup, works in your browser.",
    type: "website",
    siteName: "ToolBox Pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolBox Pro - Free Online PDF & Business Tools",
    description: "100 free online tools for PDF, business, and everyday tasks.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="/" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        {/* Inline script to set dark mode before React hydration to prevent flash & hydration mismatch */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var saved = localStorage.getItem('theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var dark = saved ? saved === 'dark' : prefersDark;
              if (dark) document.documentElement.classList.add('dark');
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
