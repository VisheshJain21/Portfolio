import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Cursor from "@/components/ui/Cursor";
import Preloader from "@/components/ui/Preloader";
import WarpCutClient from "@/components/ui/WarpCutClient";
import StatsWidget from "@/components/ui/StatsWidget";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vishesh Jain — AI-Native Engineer",
  description:
    "Portfolio of Vishesh Jain, an AI-native engineer building systems that think: agents, automation, and pipelines that reason, recover, and run themselves.",
  keywords: [
    "AI engineer",
    "AI-native",
    "LLM agents",
    "automation engineer",
    "portfolio",
    "Vishesh Jain",
  ],
  openGraph: {
    title: "Vishesh Jain — AI-Native Engineer",
    description: "Systems that think: agents, automation, AI vision — built for production.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <body>
        <a className="skip-link" href="#work">
          Skip to work
        </a>
        <Preloader />
        <SmoothScroll />
        <Cursor />
        <WarpCutClient />
        <StatsWidget />
        <div className="vignette" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
