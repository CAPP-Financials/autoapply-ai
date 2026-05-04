import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetBrains = JetBrains_Mono({
  variable: "--font-mono-loaded",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "AutoApply.AI — Resume × Job AI Analysis",
    template: "%s · AutoApply.AI",
  },
  description:
    "Upload your resume once. Paste any number of job descriptions. Get fit scores, gap analysis, tailored cover letters, ATS-optimized resumes, and interview evaluations — using your own AI provider keys.",
  applicationName: "AutoApply.AI",
  authors: [{ name: "AutoApply.AI" }],
  keywords: [
    "resume",
    "job description",
    "AI",
    "fit score",
    "ATS resume",
    "cover letter",
    "interview prep",
  ],
  openGraph: {
    title: "AutoApply.AI",
    description:
      "Bring-your-own-key AI resume × JD analyzer. Terminal-grade UI, multi-LLM council, full job tracker.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetBrains.variable} h-full`}>
      <body className="bg-bg-0 text-fg-0 min-h-full font-mono antialiased">{children}</body>
    </html>
  );
}
