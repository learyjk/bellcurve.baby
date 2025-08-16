import type { Metadata } from "next";
import { JetBrains_Mono, Cherry_Bomb_One, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
// import OneTapGoogle from "@/components/one-tap-google";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  display: "swap",
  subsets: ["latin"],
});

const cherryBomb = Cherry_Bomb_One({
  variable: "--font-cherry-bomb",
  display: "swap",
  subsets: ["latin"],
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${jetbrainsMono.variable} ${cherryBomb.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
          <Toaster />
        </ThemeProvider>
        {/* <OneTapGoogle /> */}
      </body>
    </html>
  );
}
