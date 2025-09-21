"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { CurrentUserAvatar } from "./current-user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function AuthButton({ user: initialUser }: { user?: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    // If we already have user from props, just listen for changes
    if (initialUser) {
      setLoading(false);
    } else {
      // Get initial user only if not provided via props
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);
      });
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [initialUser]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Force a full reload to clear SSR session and cookies
    window.location.href = "/auth/login";
  };

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="size-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  return user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-8 rounded-full p-0">
          <CurrentUserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer">
          <LogOut className="mr-2 size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <div className="flex gap-2">
      <Button
        asChild
        size="sm"
        variant={"outline"}
        className="hidden sm:inline-flex"
      >
        <Link href={`/auth/login?next=${pathname}`}>Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href={`/auth/sign-up?next=${pathname}`}>Sign up</Link>
      </Button>
    </div>
  );
}
