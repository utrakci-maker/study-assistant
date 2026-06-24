import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "StudyAI — AI Study Assistant for Iraqi & MENA Students",
    template: "%s | StudyAI",
  },
  description:
    "Upload a photo of your textbook or notes and get a complete AI study plan, explanation, and quiz in seconds. Works in Arabic, Kurdish, and English.",
  keywords: ["study assistant", "AI study plan", "Iraqi students", "Arabic study", "Kurdish study", "MENA students", "textbook AI"],
  authors: [{ name: "StudyAI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "StudyAI — AI Study Assistant for Iraqi & MENA Students",
    description:
      "Upload a photo of your textbook or notes and get a complete AI study plan in seconds. Arabic, Kurdish & English support.",
    siteName: "StudyAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyAI — AI Study Assistant for Iraqi & MENA Students",
    description:
      "Upload a photo of your textbook or notes and get a complete AI study plan in seconds.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StudyAI',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
