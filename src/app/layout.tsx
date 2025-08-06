//src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import LinksSheet from "@/components/nav/links-sheet";
import Header from "@/components/nav/header";
import Footer from "@/components/nav/footer";
import ThemeBridge from "@/components/theme-bridge";
import CookieConsentManager from "@/components/compliance/cookie-consent-manager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OWolf.com",
  description: "OWolf.com - The personal website of O. Wolfson.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeBridge />
          <div className="flex flex-col min-h-screen px-4 sm:px-36">
            <LinksSheet />
            <Header />
            {/* Main gets flex-1, min-h-0, flex, and overflow-auto */}
            <main className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden sm:pt-36 pt-36">
              {children}
              <CookieConsentManager />
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
