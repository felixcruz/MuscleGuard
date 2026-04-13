import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "MuscleGuard — GLP-1 Muscle Protection Coach",
    template: "%s | MuscleGuard",
  },
  description:
    "Preserve lean muscle during GLP-1 weight loss. Dose-adjusted protein targets, personalized meal planning, smart training protocols, and medication tracking for Ozempic, Wegovy, and Mounjaro users.",
  keywords: [
    "GLP-1",
    "muscle preservation",
    "Ozempic",
    "Wegovy",
    "Mounjaro",
    "protein tracking",
    "muscle loss prevention",
    "semaglutide",
    "tirzepatide",
    "GLP-1 companion app",
    "muscle protection",
  ],
  authors: [{ name: "MuscleGuard" }],
  creator: "MuscleGuard",
  publisher: "MuscleGuard",
  metadataBase: new URL("https://muscleguard.app"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://muscleguard.app",
    siteName: "MuscleGuard",
    title: "MuscleGuard — Preserve Muscle on GLP-1 Medications",
    description:
      "Up to 40% of GLP-1 weight loss can be muscle. MuscleGuard helps you hit dose-adjusted protein targets, follow smart training protocols, and track your medication — all in one app.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MuscleGuard — GLP-1 Muscle Protection Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MuscleGuard — Preserve Muscle on GLP-1 Medications",
    description:
      "Dose-adjusted protein targets, smart meal planning, and training protocols for Ozempic, Wegovy, and Mounjaro users.",
    images: ["/og-image.png"],
  },
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
