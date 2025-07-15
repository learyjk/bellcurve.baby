import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">
        Baby Betting Pool: How It Works
      </h1>
      <Tabs defaultValue="layman" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="layman">For the layman</TabsTrigger>
          <TabsTrigger value="nerds">For the nerds</TabsTrigger>
        </TabsList>
        <TabsContent value="layman">
          <div className="space-y-4">
            <p>We&apos;re not just randomly slapping prices on your guesses.</p>
            <p>
              Think of it like this—imagine everyone&apos;s guesses plotted on a
              hill. The peak of the hill is the expected due date or birth
              weight. If you guess right at the peak, you&apos;re paying premium
              prices because, well, you&apos;re probably right and that&apos;s
              not fair to everyone else.
            </p>
            <p>
              But if you guess way out in left field—like the baby will be born
              3 weeks late or weigh 12 pounds—your guess gets cheaper because
              you&apos;re taking a bigger risk.
            </p>
            <p>
              We cap the prices so nobody goes broke and nobody gets to play for
              free. It&apos;s like surge pricing, but for baby predictions, and
              with actual math behind it instead of just corporate capitalism.
            </p>
            <p>
              Before the bets go live, the creators pick one of these models:
            </p>
            <div className="p-4 rounded-lg border">
              <ul className="space-y-2">
                <li>
                  <strong>Standard:</strong> Balanced. Close guesses cost more,
                  wild guesses cost less.
                </li>
                <li>
                  <strong>Chill:</strong> Even if you think this baby is
                  arriving on leap day, you&apos;re still in the game.
                </li>
              </ul>
            </div>
            <p>
              Basically, we&apos;re trying to make it fair while keeping it fun.
              And yes, there&apos;s actual math involved, but you don&apos;t
              need to care about that part.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="nerds">
          <div className="space-y-4">
            <p>You know who you are. Welcome! Game recognize game.</p>
            <p>
              We&apos;re using a Gaussian distribution centered on the expected
              value (due date or birth weight) to model the probability of each
              outcome. Then we&apos;re applying min-max normalization to map
              those probabilities to a bounded price range.
            </p>
            <p>Here&apos;s the flow:</p>
            <div className="p-4 rounded-lg border">
              <ol className="space-y-2 list-decimal list-inside">
                <li>
                  Calculate the probability density for each possible guess
                  using the Gaussian
                </li>
                <li>
                  Apply min-max normalization:{" "}
                  <code className="px-2 py-1 rounded text-sm font-mono border">
                    (value - min) / (max - min)
                  </code>
                </li>
                <li>
                  Map to your price range with the configurable
                  &quot;aggressiveness&quot; parameter
                </li>
              </ol>
            </div>
            <p>
              The aggressiveness parameter controls the standard deviation of
              the Gaussian:
            </p>
            <div className="p-4 rounded-lg border">
              <ul className="space-y-2">
                <li>
                  <strong>Standard</strong> (σ = 1.0): Standard distribution,
                  balanced curve
                </li>
                <li>
                  <strong>Chill</strong> (σ = 2.0): Wide distribution, gentler
                  price gradients
                </li>
              </ul>
            </div>
            <p>
              We bound the domain to ±3 weeks for dates and ±3 lbs for weight,
              so the min-max normalization keeps everything predictable. The
              highest price always lands on the expected value (your target), and the
              lowest price always lands at the domain boundaries.
            </p>
            <p>
              It&apos;s elegant, predictable, and prevents any weird edge cases
              where someone pays $0.01 to guess the baby will be born in 10 years.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
