import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Announcement — bellcurve.baby",
  description:
    "A playful announcement about bellcurve.baby — what it is and how it works",
};

export default function AnnouncementPage() {
  return (
    <main className="min-h-screen flex flex-col items-center py-12">
      <div className="w-full max-w-4xl px-4">
        <article className="mx-auto max-w-4xl prose prose-lg prose-invert dark:prose-invert leading-relaxed">
          <header className="mb-8">
            <h1 className="text-4xl font-cherry-bomb tracking-wide md:text-5xl font-bold leading-tight max-w-4xl mx-auto">
              What do you get when a web developer falls in love with a
              mathematical modeler &amp; data-vis designer?
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Well, a baby (coming soon!), who’s probably gonna grow up to be a
              nerd.
            </p>
          </header>

          <figure>
            <Image
              src="/image4.jpg"
              alt="Announcement hero"
              width={1024}
              height={768}
              className="w-full rounded-lg object-cover mx-auto max-w-4xl"
            />
          </figure>

          <section className="space-y-6 mt-6 ">
            <p className="max-w-xl mx-auto">
              But also, a fun little web app game that turns birth date and
              weight guesses into a way to support our family in lieu of a
              registry.
            </p>

            <p className="max-w-xl mx-auto">
              {" "}
              As woefully practical and unluxurious people, we didn’t want a
              pile of gifts that may not go to use. So we built something
              playful, nerdy, and community-driven. It’s an expression of who we
              are as a couple, and we hope it invites you into the anticipation!
            </p>

            <h2 className="mt-4 max-w-xl mx-auto text-2xl font-semibold">
              At a glance: How it works
            </h2>

            <ol className="max-w-xl mx-auto list-decimal list-inside space-y-3">
              <li>
                <strong>Pick your guess(es).</strong> Use two sliders to choose
                a birth date and birth weight. We’ll give you some info to help
                you guess.
              </li>
              <li>
                <strong>Pay the odds.</strong> Safer guesses cost more; bold
                guesses cost less. The cost of your guess is your donation to
                our family.
              </li>
              <li>
                <strong>See the chart.</strong> Your guess(es) appear alongside
                everyone else’s, so you can watch the field fill in.
              </li>
              <li>
                <strong>Win some glory.</strong> When the baby arrives, the
                three closest guesses get a little prize and bragging rights.
              </li>
            </ol>

            <h2 className="mt-6 max-w-xl mx-auto text-2xl font-semibold">
              How it all started
            </h2>

            <p className="max-w-xl mx-auto">
              {" "}
              We had just booked the venue for our baby shower, and were at
              dinner with Keegan’s parents. The table talk drifted toward what
              games to play at the party.
            </p>

            <p className="max-w-xl mx-auto">
              Keegan’s stepdad, Dave, casually tossed out an idea: “What about a
              betting pool on the baby’s birth date and weight?”
            </p>

            <p className="max-w-xl mx-auto">
              The moment she heard “betting pool,” Heather wasn’t picturing
              slips of paper. She saw a giant parameter space filling with
              guesses. She wondered: Would everyone cluster around the “safe”
              answers? How could we tempt people into making bolder, wilder
              guesses?
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              <Image
                src="/image6.png"
                alt="chart"
                width={700}
                height={500}
                className="rounded w-full object-cover mx-auto max-w-3xl"
              />
              <Image
                src="/image5.png"
                alt="design"
                width={700}
                height={500}
                className="rounded w-full object-cover mx-auto max-w-3xl"
              />
            </div>

            <p className="max-w-xl mx-auto">
              Heather worked on the branding and design in parallel. Many late
              nights followed. Two laptops side by side, digitally playing in
              the same Github repo and Figma file.
            </p>

            <figure className="mt-6">
              <Image
                src="/image1.jpg"
                alt="couple"
                width={1200}
                height={800}
                className="w-full rounded-lg object-cover mx-auto max-w-3xl"
              />
            </figure>

            <p className="mt-6 max-w-xl mx-auto">
              Thanks for reading — we can’t wait to share the game with you when
              the baby arrives!
            </p>

            <p className="mt-6 max-w-xl mx-auto">
              <Button asChild>
                <Link href="/baby/finn">Guess on Baby Finn!</Link>
              </Button>
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
