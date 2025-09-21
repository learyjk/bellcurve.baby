import type { Metadata } from "next";
import { JetBrains_Mono, Cherry_Bomb_One, Quicksand } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Image from "next/image";
// import OneTapGoogle from "@/components/one-tap-google";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "bellcurve.baby",
  description:
    "Collect donations and celebrate your newborn with a fun guessing game.",
};

// const inter = Inter({
//   variable: "--font-inter",
//   display: "swap",
//   subsets: ["latin"],
// });

const quicksand = Quicksand({
  variable: "--font-quicksand",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        className={`${quicksand.className} ${jetbrainsMono.variable} ${cherryBomb.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="w-full flex flex-col items-center border-t mx-auto text-center text-xs gap-8 p-4">
              <div className="flex flex-col items-center gap-4">
                <Image
                  src="/bcb-h-stack.svg"
                  alt="Heather and Keegan"
                  width={100}
                  height={100}
                />
                <div className="flex items-center justify-center gap-4">
                  <p>Built by Heather & Keegan</p>
                  <ThemeSwitcher />
                </div>
              </div>
            </footer>
          </div>
          <Toaster
            position="top-center"
            expand={true}
            richColors={true}
            closeButton={true}
            style={{
              zIndex: 99999,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
