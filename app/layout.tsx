import type { Metadata } from "next";
import { Inter, Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { THEME_SCRIPT } from "@/lib/theme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const display = Instrument_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  style: ["italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gabi-comm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${display.variable} ${serif.variable} antialiased`}>{children}</body>
    </html>
  );
}
