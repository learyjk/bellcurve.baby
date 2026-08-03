import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getFeeCents } from "@/lib/constants";
import { getStripe } from "@/lib/stripe";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Platform Fees - Admin" };

// Donor-pays model: the guess price is transferred to the creator in full
// and the platform keeps a 10% fee charged on top (its own checkout line
// item), so there is no Stripe application_fee object to list. The source of
// truth for platform earnings is therefore our own guesses table.
//
// Dev and prod share one Supabase DB but use different Stripe keys (test vs
// live), and Stripe payment ids share the pi_3... prefix, so the only way to
// tell a sandbox payment from a real one is the charge's `livemode` flag.
type GuessRow = {
  id: string;
  created_at: string | null;
  calculated_price: number; // dollars, the guess amount the creator received
  payment_status: string | null;
  payment_id: string | null;
  pool_id: string;
  pools: { slug: string } | null;
};

type FeeRow = GuessRow & {
  /** true = real money, false = sandbox, null = couldn't determine. */
  livemode: boolean | null;
};

// Resolve livemode per payment by looking at its Stripe charge. Batched with
// a small concurrency cap so a large page doesn't hammer the Stripe API.
async function withLivemode(rows: GuessRow[]): Promise<FeeRow[]> {
  const stripe = getStripe();
  const CONCURRENCY = 5;
  const out: FeeRow[] = new Array(rows.length);
  let i = 0;
  async function worker() {
    while (i < rows.length) {
      const idx = i++;
      const row = rows[idx];
      let livemode: boolean | null = null;
      if (row.payment_id) {
        try {
          const pi = await stripe.paymentIntents.retrieve(row.payment_id, {
            expand: ["latest_charge"],
          });
          const charge = pi.latest_charge;
          if (charge && typeof charge !== "string") {
            livemode = charge.livemode;
          }
        } catch {
          livemode = null;
        }
      }
      out[idx] = { ...row, livemode };
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return out;
}

export default async function AdminFeesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin/fees");
  }

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed.includes(user.email?.toLowerCase() ?? "")) {
    notFound();
  }

  const { data: rows, error } = await supabase
    .from("guesses")
    .select(
      "id, created_at, calculated_price, payment_status, payment_id, pool_id, pools(slug)"
    )
    .in("payment_status", ["paid", "refunded"])
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<GuessRow[]>();

  if (error) {
    console.error("Failed to load platform fees:", error);
  }
  const fees = await withLivemode(rows ?? []);

  const isPaid = (f: FeeRow) => f.payment_status === "paid";
  const isLive = (f: FeeRow) => f.livemode === true;
  const guessCents = (f: FeeRow) => Math.round(f.calculated_price * 100);
  const feeCentsFor = (f: FeeRow) => getFeeCents(guessCents(f));

  // Live (real-money) totals — the headline numbers.
  const liveFees = fees.filter((f) => isPaid(f) && isLive(f));
  const liveFeeCents = liveFees.reduce((s, f) => s + feeCentsFor(f), 0);
  const liveGrossCents = liveFees.reduce((s, f) => s + guessCents(f), 0);
  // Sandbox totals, shown separately so they don't inflate the real numbers.
  const testFees = fees.filter((f) => isPaid(f) && f.livemode === false);
  const testFeeCents = testFees.reduce((s, f) => s + feeCentsFor(f), 0);
  const testGrossCents = testFees.reduce((s, f) => s + guessCents(f), 0);

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 py-12">
      <h1 className="font-cherry-bomb text-3xl md:text-6xl font-bold text-pretty text-center tracking-wide mb-8">
        Platform Fees
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">
            Fees collected (live)
          </div>
          <div className="font-cherry-bomb text-4xl">
            ${(liveFeeCents / 100).toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">
            Guess volume (live)
          </div>
          <div className="font-cherry-bomb text-4xl">
            ${(liveGrossCents / 100).toFixed(2)}
          </div>
        </div>
      </div>

      {testFees.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mb-8">
          Plus{" "}
          <span className="font-medium">
            ${(testFeeCents / 100).toFixed(2)}
          </span>{" "}
          in fees on{" "}
          <span className="font-medium">
            ${(testGrossCents / 100).toFixed(2)}
          </span>{" "}
          of sandbox (test-mode) guesses — not real money.
        </p>
      )}

      {fees.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No paid guesses yet.
        </p>
      ) : (
        <div className="rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Guess amount</TableHead>
                <TableHead>Your fee</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pool</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => {
                const refunded = fee.payment_status === "refunded";
                return (
                  <TableRow
                    key={fee.id}
                    className={refunded ? "opacity-60" : undefined}
                  >
                    <TableCell>
                      {fee.created_at
                        ? new Date(fee.created_at).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className={refunded ? "line-through" : undefined}>
                        ${(guessCents(fee) / 100).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={refunded ? "line-through" : undefined}>
                        ${(feeCentsFor(fee) / 100).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {fee.livemode === true ? (
                        <Badge variant="default">Live</Badge>
                      ) : fee.livemode === false ? (
                        <Badge variant="secondary">Test</Badge>
                      ) : (
                        <Badge variant="outline">—</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {refunded ? (
                        <span className="text-xs font-medium text-orange-600">
                          Refunded
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">Collected</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {fee.pools?.slug ?? fee.pool_id}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
