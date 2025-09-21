import HowItWorks from "@/components/blocks/hero-sections/how_it_works_component";
import Image from "next/image";
import MainHero from "@/components/blocks/hero-sections/main-hero";
import { Card, CardContent } from "@/components/ui/card";
import priceSurface from "../public/price_surface.gif";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl px-4 mt-8 flex justify-start">
          <a
            href="/announcement"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            Read the announcement
          </a>
        </div>
        <MainHero />
        <section className="w-full max-w-2xl flex flex-col items-start gap-4 px-4 py-12">
          <HowItWorks />
          {/* <SuperLogo width={150} /> */}
          <Card className="overflow-hidden shadow-none">
            <CardContent className="p-0">
              <Image
                src={priceSurface}
                alt="Bell Curve Logo"
                width={500}
                style={{ height: "auto" }}
                className="mx-auto"
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
