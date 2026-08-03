import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getFeeCents } from "@/lib/constants";
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
type FeeRow = {
  id: string;
  created_at: string | null;
  calculated_price: number; // dollars, the guess amount the creator received
  payment_status: string | null;
  pool_id: string;
  pools: { slug: string } | null;
};

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
    .select("id, created_at, calculated_price, payment_status, pool_id, pools(slug)")
    .in("payment_status", ["paid", "refunded"])
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<FeeRow[]>();

  if (error) {
    console.error("Failed to load platform fees:", error);
  }
  const fees = rows ?? [];

  const isPaid = (f: FeeRow) => f.payment_status === "paid";

  // Guess volume = what creators received (the guess amounts), paid only.
  const grossCents = fees
    .filter(isPaid)
    .reduce((sum, f) => sum + Math.round(f.calculated_price * 100), 0);
  // Platform fee kept = 10% surcharge on each paid guess (refunded fees were
  // returned to the guesser).
  const totalFeeCents = fees
    .filter(isPaid)
    .reduce((sum, f) => sum + getFeeCents(Math.round(f.calculated_price * 100)), 0);

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 py-12">
      <h1 className="font-cherry-bomb text-3xl md:text-6xl font-bold text-pretty text-center tracking-wide mb-8">
        Platform Fees
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">Fees collected</div>
          <div className="font-cherry-bomb text-4xl">
            ${(totalFeeCents / 100).toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">Guess volume</div>
          <div className="font-cherry-bomb text-4xl">
            ${(grossCents / 100).toFixed(2)}
          </div>
        </div>
      </div>

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
                <TableHead>Status</TableHead>
                <TableHead>Pool</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => {
                const refunded = fee.payment_status === "refunded";
                const guessCents = Math.round(fee.calculated_price * 100);
                const feeCents = getFeeCents(guessCents);
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
                        ${(guessCents / 100).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={refunded ? "line-through" : undefined}>
                        ${(feeCents / 100).toFixed(2)}
                      </span>
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
