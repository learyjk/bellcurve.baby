import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Stripe from "stripe";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Platform Fees - Admin" };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type FeeRow = {
  id: string;
  created: number;
  amount: number;
  chargeAmount: number | null;
  account: string;
};

async function getFees(): Promise<FeeRow[]> {
  const fees = await stripe.applicationFees.list({ limit: 50 });
  return Promise.all(
    fees.data.map(async (fee) => {
      let chargeAmount: number | null = null;
      // fee.charge is the charge id on the connected account; look up the
      // originating charge amount via the balance transaction when possible.
      if (typeof fee.originating_transaction === "string") {
        try {
          const charge = await stripe.charges.retrieve(
            fee.originating_transaction
          );
          chargeAmount = charge.amount;
        } catch {
          chargeAmount = null;
        }
      }
      return {
        id: fee.id,
        created: fee.created,
        amount: fee.amount,
        chargeAmount,
        account: typeof fee.account === "string" ? fee.account : fee.account.id,
      };
    })
  );
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

  const fees = await getFees();
  const totalCents = fees.reduce((sum, f) => sum + f.amount, 0);
  const grossCents = fees.reduce((sum, f) => sum + (f.chargeAmount ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 py-12">
      <h1 className="font-cherry-bomb text-3xl md:text-6xl font-bold text-pretty text-center tracking-wide mb-8">
        Platform Fees
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">Fees collected</div>
          <div className="font-cherry-bomb text-4xl">
            ${(totalCents / 100).toFixed(2)}
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
          No application fees collected yet.
        </p>
      ) : (
        <div className="rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Guess amount</TableHead>
                <TableHead>Your fee</TableHead>
                <TableHead>Connected account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>
                    {new Date(fee.created * 1000).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {fee.chargeAmount !== null
                      ? `$${(fee.chargeAmount / 100).toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${(fee.amount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {fee.account}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
