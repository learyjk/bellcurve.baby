import * as React from "react";
import Link from "next/link";

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
import { MobileMenu } from "@/components/mobile-menu";
import { createClient } from "@/lib/supabase/server";
import { hasFeatureAccess } from "@/lib/features";
import { FEATURES } from "@/lib/features/types";
import { LogoOnly } from "./svg/logo-only";

export async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user has access to create baby pools
  const canCreateBabyPool = user
    ? await hasFeatureAccess(user.id, FEATURES.CREATE_BABY_POOL)
    : false;

  // Build menu items so we can align rows and set dynamic row-span
  const menuItems: Array<{ href: string; title: string; desc: string }> = [];
  if (canCreateBabyPool) {
    menuItems.push(
      { href: "/baby", title: "My Babies", desc: "See My Babies" },
      {
        href: "/baby/create",
        title: "Create Baby Pool",
        desc: "Create My Baby Pool",
      }
    );
  }
  menuItems.push(
    {
      href: "/announcement",
      title: "Announcement",
      desc: "Read our announcement",
    },
    {
      href: "/guesses",
      title: "My Guesses",
      desc: "View all your submitted guesses",
    }
  );

  // Tailwind needs static class names; choose between 2 and 4 rows
  const brandRowSpanClass = canCreateBabyPool ? "row-span-4" : "row-span-2";

  return (
    <>
      <nav className="relative flex items-center w-full mx-auto px-4 py-2 border-b">
        {/* Left section - Mobile: Menu Button, Desktop: Navigation Menu */}
        <div className="flex-1 flex justify-start">
          {/* Mobile: Menu Button */}
          <MobileMenu
            canCreateBabyPool={canCreateBabyPool}
            className="md:hidden"
          />

          {/* Desktop: Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid auto-rows-fr gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className={brandRowSpanClass}>
                      <NavigationMenuLink asChild>
                        <Link
                          className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                          href="/"
                        >
                          <div className="mt-2 mb-2 flex flex-col gap-2">
                            {/* <LogoOnly /> */}
                            <div className="text-lg font-medium">
                              bellcurve.baby
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            A Guessing Game for Expecting Parents and Friends
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    {menuItems.map((item) => (
                      <ListItem
                        key={item.href}
                        href={item.href}
                        title={item.title}
                      >
                        {item.desc}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Center section - Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <LogoOnly />
            <span className="font-cherry-bomb text-primary text-md hidden md:block">
              bellcurve.baby
            </span>
          </Link>
        </div>

        {/* Right section - Auth Button */}
        <div className="flex-1 flex justify-end">
          <AuthButton user={user} />
        </div>
      </nav>
    </>
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
