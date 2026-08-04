import HowItWorks from "@/components/blocks/hero-sections/how_it_works_component";
import Faq from "@/components/blocks/faq";
import Image from "next/image";
import MainHero from "@/components/blocks/hero-sections/main-hero";
import { Card, CardContent } from "@/components/ui/card";
import priceSurface from "../public/price_surface.gif";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <MainHero />
        <section className="w-full max-w-2xl flex flex-col items-start gap-4 px-4 py-12">
          <HowItWorks />
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
        <section className="w-full max-w-2xl flex flex-col items-start gap-4 px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg text-muted-foreground font-medium mb-8">
              After baby is born: Close the pool, see how the guesses
              ranked!
            </h2>
            <div className="space-y-4">
              <p>
                After baby is born, close the pool and enter in their actual
                birth weight and date. The guesses will appear in a data visual
                + table in the order of how close they were to the actual.
              </p>
              <p>The top 3 closest guesses will be crowned the winners!</p>
              {/* GIF will be inserted here */}
            </div>
          </div>
        </section>
        <Faq />
      </div>
    </main>
  );
}
