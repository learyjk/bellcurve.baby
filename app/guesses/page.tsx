import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Tables } from "@/database.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Type for the joined query result
type GuessWithPool = Tables<"guesses"> & {
  pools: {
    slug: string;
    baby_name: string | null;
  } | null;
};

export default async function MyGuessesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: guesses, error } = await supabase
    .from("guesses")
    .select("*, pools (slug, baby_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // Log useful fields from Supabase error to avoid printing an empty object
    console.error("Supabase error querying guesses:", {
      message: error.message,
      details: error.details,
      code: error.code,
    });

    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 border rounded-lg bg-card shadow">
        <h1 className="text-2xl font-bold mb-4">My Guesses</h1>
        <div className="text-destructive">
          There was an error loading your guesses. Try again later.
        </div>
        <pre className="mt-4 text-xs text-muted-foreground overflow-auto whitespace-pre-wrap">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  const rows: GuessWithPool[] = guesses || [];

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-4">My Guesses</h1>
      {rows.length > 0 ? (
        <div className="rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pool</TableHead>
                <TableHead>Guessed Date</TableHead>
                <TableHead>Guessed Weight</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((guess) => {
                return (
                  <TableRow key={guess.id}>
                    <TableCell>
                      {guess.pools?.slug ? (
                        <Link
                          href={`/baby/${guess.pools.slug}`}
                          className="hover:underline"
                        >
                          {guess.pools?.baby_name || guess.pools?.slug}
                        </Link>
                      ) : (
                        guess.pools?.baby_name || guess.pools?.slug || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(guess.guessed_birth_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const weightInOunces = guess.guessed_weight;
                        const pounds = Math.floor(weightInOunces / 16);
                        const ounces = Math.round(weightInOunces % 16);
                        return `${pounds} lbs ${ounces} oz`;
                      })()}
                    </TableCell>
                    <TableCell>{`$${guess.calculated_price.toFixed(
                      2
                    )}`}</TableCell>
                    <TableCell>{guess.payment_status || "unpaid"}</TableCell>
                    <TableCell>
                      {guess.created_at
                        ? new Date(guess.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground">
          You have not submitted any guesses yet.
        </p>
      )}
    </div>
  );
}
