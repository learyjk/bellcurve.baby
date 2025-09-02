import HowItWorks from "@/components/blocks/hero-sections/how_it_works_component";
import Image from "next/image";
import MainHero from "@/components/blocks/hero-sections/main-hero";
import { Card, CardContent } from "@/components/ui/card";
import SuperLogo from "@/components/svg/super-logo";
import priceSurface from "../public/price_surface.gif";

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
                src={priceSurface}
                alt="Bell Curve Logo"
                width={500}
                height={500}
                className="mx-auto"
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
