"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminDeletePool } from "@/lib/actions/admin/deletePool";
import { adminDeleteUser } from "@/lib/actions/admin/deleteUser";
import { toast } from "sonner";

type PoolRow = {
  id: string;
  slug: string;
  babyName: string | null;
  createdAt: string | null;
  ownerId: string;
};

type UserRow = {
  id: string;
  email: string;
  created_at: string;
};

export function AdminCleanupClient({
  pools,
  users,
  poolCountByOwner,
  currentUserId,
}: {
  pools: PoolRow[];
  users: UserRow[];
  poolCountByOwner: Record<string, number>;
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [gonePools, setGonePools] = useState<Set<string>>(new Set());
  const [goneUsers, setGoneUsers] = useState<Set<string>>(new Set());

  const visiblePools = pools.filter((p) => !gonePools.has(p.id));
  const visibleUsers = users.filter((u) => !goneUsers.has(u.id));

  const handleDeletePool = (pool: PoolRow) => {
    startTransition(async () => {
      const result = await adminDeletePool(pool.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Pool deleted.");
        setGonePools((s) => new Set(s).add(pool.id));
      }
    });
  };

  const handleDeleteUser = (u: UserRow) => {
    startTransition(async () => {
      const result = await adminDeleteUser(u.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "User deleted.");
        setGoneUsers((s) => new Set(s).add(u.id));
      }
    });
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-cherry-bomb text-2xl mb-3">Pools</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pool</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiblePools.map((pool) => (
              <TableRow key={pool.id}>
                <TableCell>{pool.babyName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {pool.slug}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {pool.createdAt
                    ? new Date(pool.createdAt).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={pending}
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete pool &quot;{pool.babyName ?? pool.slug}&quot;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          All paid guesses will be refunded in Stripe first,
                          then the pool, its guesses, and rankings will be
                          permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePool(pool)}
                        >
                          Refund &amp; delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {visiblePools.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No pools.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="font-cherry-bomb text-2xl mb-3">Users</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Pools owned</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  {u.email}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </TableCell>
                <TableCell>{poolCountByOwner[u.id] ?? 0}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {u.id === currentUserId ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={pending}
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete user {u.email}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Every paid guess on their pools (and their own
                            paid guesses elsewhere) will be refunded in Stripe
                            first. Then their pools, guesses, rankings, and
                            auth account will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(u)}
                          >
                            Refund &amp; delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {visibleUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No users.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
