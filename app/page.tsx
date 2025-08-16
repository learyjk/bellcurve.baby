import { ThemeSwitcher } from "@/components/theme-switcher";
import HowItWorks from "@/components/blocks/hero-sections/how_it_works_component";
import Image from "next/image";
import MainHero from "@/components/blocks/hero-sections/main-hero";
import { Card, CardContent } from "@/components/ui/card";
import SuperLogo from "@/components/svg/super-logo";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <MainHero />
        <section className="w-full max-w-2xl flex flex-col items-start gap-4 p-8">
          <HowItWorks />
          <SuperLogo width={150} />
          <Card className="overflow-hidden shadow-none">
            <CardContent className="p-0">
              <Image
                src="/price_surface.gif"
                alt="Bell Curve Logo"
                width={500}
                height={500}
                className="mx-auto"
              />
            </CardContent>
          </Card>
        </section>
        <footer className="w-full flex flex-col items-center border-t mx-auto text-center text-xs gap-8 p-4">
          <div className="flex items-center gap-4">
            <p>Built by Heather & Keegan</p>
            <ThemeSwitcher />
          </div>
        </footer>
      </div>
    </main>
  );
}
