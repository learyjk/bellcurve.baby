import { ThemeSwitcher } from "@/components/theme-switcher";
import HeroSectionSimpleCentred from "@/components/blocks/hero-sections/simple-centred";

import HowItWorks from "@/components/blocks/hero-sections/how_it_works_component";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <HeroSectionSimpleCentred />
        <HowItWorks />
        <Image
          src="/price_surface.gif"
          alt="Baby Bets Logo"
          width={500}
          height={500}
          className="mx-auto"
        />
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>Built by Heather and Keegan</p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
