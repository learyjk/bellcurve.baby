"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  canCreateBabyPool: boolean;
  className?: string;
}

export function MobileMenu({ canCreateBabyPool, className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2"
      >
        {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border z-50">
          <div className="flex flex-col p-4 space-y-2">
            <Link
              href="/"
              className="block px-3 py-2 text-sm hover:bg-accent rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            {canCreateBabyPool && (
              <Link
                href="/baby"
                className="block px-3 py-2 text-sm hover:bg-accent rounded-md"
                onClick={() => setIsOpen(false)}
              >
                My Babies
              </Link>
            )}
            {canCreateBabyPool && (
              <Link
                href="/baby/create"
                className="block px-3 py-2 text-sm hover:bg-accent rounded-md"
                onClick={() => setIsOpen(false)}
              >
                Create Baby Pool
              </Link>
            )}
            <Link
              href="/announcement"
              className="block px-3 py-2 text-sm hover:bg-accent rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Announcement
            </Link>
            <Link
              href="/guesses"
              className="block px-3 py-2 text-sm hover:bg-accent rounded-md"
              onClick={() => setIsOpen(false)}
            >
              My Guesses
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
