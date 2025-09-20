import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, Mail, ArrowLeft } from "lucide-react";

export default async function PaymentErrorPage({
  searchParams,
}: {
  searchParams: Promise<{
    payment_intent?: string;
    session_id?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Payment Processing Error</CardTitle>
            <CardDescription>
              Your payment was processed but we couldn&apos;t complete your
              guess
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>What happened?</strong> Your payment went through
                successfully, but we encountered a technical issue while
                recording your guess.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Don&apos;t worry - we&apos;ll help resolve this quickly:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Your payment was successful</li>
                <li>• We have a record of the transaction</li>
                <li>• Support will manually add your guess</li>
                <li>• Or process a refund if you prefer</li>
              </ul>
            </div>

            {params.payment_intent && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Payment Reference:</strong> {params.payment_intent}
                </p>
                {params.session_id && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Session ID:</strong> {params.session_id}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="mailto:support@bellcurve.baby?subject=Payment%20Processing%20Error&body=Payment%20Reference:%20${params.payment_intent}%0ASession%20ID:%20${params.session_id}">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/baby">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Pools
                </Link>
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                We typically resolve these issues within 24 hours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
