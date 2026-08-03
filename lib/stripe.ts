import Stripe from "stripe";

// Lazily instantiated so `next build` can collect page data in environments
// (e.g. CI) where STRIPE_SECRET_KEY is not set. Constructing a Stripe client
// at module scope throws "Neither apiKey nor config.authenticator provided"
// during static analysis of any page that imports it.
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripe = new Stripe(key);
  }
  return stripe;
}
