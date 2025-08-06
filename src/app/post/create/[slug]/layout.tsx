// src/app/post/create/[slug]/layout.tsx

import { ThemeProvider } from "@/components/theme-provider";
import { Geist, Geist_Mono } from "next/font/google";
// Only import font variables if you use them
import "@/app/globals.css"; // Ensure this is present

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function EditorFullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`fixed inset-0 h-full w-full z-50 bg-background flex flex-col ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </div>
  );
}
