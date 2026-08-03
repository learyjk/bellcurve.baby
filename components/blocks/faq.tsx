import {
  DEFAULT_PRICE_CEILING,
  DEFAULT_PRICE_FLOOR,
  MAX_PRICE_CEILING,
  MIN_PRICE_FLOOR,
  PLATFORM_FEE_PERCENT,
} from "@/lib/constants";

const CREATOR_KEEP_PERCENT = Math.round((1 - PLATFORM_FEE_PERCENT) * 100);
const PLATFORM_PERCENT = Math.round(PLATFORM_FEE_PERCENT * 100);

type Faq = { q: string; a: React.ReactNode };

const faqs: Faq[] = [
  {
    q: "How do pool creators get paid?",
    a: (
      <>
        <p>
          Connect your Stripe account when you create a pool (it takes about
          five minutes and only happens once — any pools you create later
          reuse it). From then on, every guess is paid directly into your
          Stripe account the moment someone guesses. No waiting for the pool
          to close, no payout requests, no minimums.
        </p>
        <p>
          Stripe then deposits to your bank on their normal schedule (usually
          ~2 business days). Closing the pool just crowns the winner — the
          money is already yours either way.
        </p>
      </>
    ),
  },
  {
    q: "How much does it cost?",
    a: (
      <>
        <p>
          Creating a pool is free. Guessers pay the price shown on the sliders
          — and that&apos;s exactly what they pay, nothing added on top.
        </p>
        <p>
          Creators keep exactly {CREATOR_KEEP_PERCENT}% of every guess —
          that&apos;s a flat rate with no other deductions. We take a{" "}
          {PLATFORM_PERCENT}% platform fee and cover the card processing costs
          out of our share. Example: on a $45 guess, the creator receives
          exactly $40.50.
        </p>
      </>
    ),
  },
  {
    q: "What settings do I control as a pool creator?",
    a: (
      <>
        <ul className="list-disc pl-5 space-y-1">
          <li>Baby name, due date, and expected weight (the pricing peak)</li>
          <li>Your pool URL (bellcurve.baby/baby/your-name)</li>
          <li>
            Min and max guess prices — anywhere between ${MIN_PRICE_FLOOR} and
            ${MAX_PRICE_CEILING}
          </li>
          <li>
            Pricing model: Standard (balanced) or Chill (even wild guesses
            stay pricey)
          </li>
          <li>Description, ultrasound photo, organizer photo, and an optional YouTube/Vimeo announcement video</li>
          <li>When the day comes: you close the pool with the actual birth date and weight, and we crown the winner</li>
        </ul>
      </>
    ),
  },
  {
    q: "What min/max guess amounts do you recommend?",
    a: (
      <>
        <p>
          Our defaults are ${DEFAULT_PRICE_FLOOR} / ${DEFAULT_PRICE_CEILING},
          and we recommend most pools stick close to them. On our first real
          pool the median guess was about $46 — friends are more generous
          than you&apos;d expect, and almost nobody picks the cheap joke
          guesses.
        </p>
        <p>
          Don&apos;t set the max too low: roughly 1 in 10 guessers hit the $50
          ceiling on that pool. A higher max means your most generous friends
          simply give more.
        </p>
      </>
    ),
  },
  {
    q: "Is this betting?",
    a: (
      <p>
        No — think of it as a donation with a game attached. Every guess is a
        gift to the expecting family, and the &ldquo;prize&rdquo; is bragging
        rights, not money. The pool creator keeps the guesses regardless of
        who wins.
      </p>
    ),
  },
  {
    q: "Can I guess without an account?",
    a: (
      <p>
        You need a free account to place a guess (that&apos;s how we keep your
        guesses and receipts together). Once you&apos;re in, you can also make
        any individual guess publicly anonymous — only the pool creator sees
        your name.
      </p>
    ),
  },
  {
    q: "What happens when the baby arrives?",
    a: (
      <p>
        The creator enters the actual birth date and weight, which locks the
        pool and ranks every guess by how close it was. The winner gets eternal
        glory (and the family gets the gifts). Rankings are visible to everyone
        on the pool page.
      </p>
    ),
  },
  {
    q: "What if I need a refund?",
    a: (
      <p>
        If you made a guess by mistake, contact the pool creator — they can
        refund any guess on their pool straight from their pool page (it&apos;s
        instant and irreversible). You always get 100% of your donation back,
        including the platform fee. Pool creators: open your pool, find the
        guess in the table, and hit Refund.
      </p>
    ),
  },
];

export default function Faq() {
  return (
    <section className="w-full max-w-2xl px-4 pb-16" id="faq">
      <h2 className="text-3xl font-cherry-bomb tracking-wide font-semibold mb-2">
        Frequently Asked Questions
      </h2>
      <p className="text-muted-foreground mb-6">
        The money stuff, the settings, and what happens on the big day.
      </p>
      <div className="divide-y rounded-lg border">
        {faqs.map((faq) => (
          <details key={faq.q} className="group px-4 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
              {faq.q}
              <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
