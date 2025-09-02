import * as React from "react";
import Link from "next/link";
// import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  // navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { AuthButton } from "@/components/auth-button";
import { Logo } from "./svg/logo";
import { createClient } from "@/lib/supabase/server";
import { hasFeatureAccess } from "@/lib/features";
import { FEATURES } from "@/lib/features/types";

export async function Navbar() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user has access to create baby pools
  const canCreateBabyPool = user ? await hasFeatureAccess(user.id, FEATURES.CREATE_BABY_POOL) : false;

  return (
    <nav className="grid grid-cols-3 items-center w-full mx-auto px-4 py-2 border-b">
      <NavigationMenu className="flex items-start justify-self-start">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <Link
                      className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                      href="/"
                    >
                      <div className="mt-4 mb-2 text-lg font-medium">
                        bellcurve.baby
                      </div>
                      <p className="text-muted-foreground text-sm leading-tight">
                        A Guessing Game for Expecting Parents and Friends
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
                {canCreateBabyPool && (
                  <ListItem href="/baby" title="My Babies">
                    See My Babies
                  </ListItem>
                )}
                {canCreateBabyPool && (
                  <ListItem href="/baby/create" title="Create Baby Pool">
                    Create My Baby Pool
                  </ListItem>
                )}
                <ListItem href="/guesses" title="My Guesses">
                  View all your submitted guesses
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex items-center justify-self-center">
        <Link href="/">
          <Logo />
        </Link>
      </div>

      <div className="flex items-end justify-self-end">
        <AuthButton />
      </div>
    </nav>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string; title: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
