"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // pill container with subtle background
        "inline-flex items-center gap-2 w-fit rounded-full p-1 bg-muted/30 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // pill-style trigger: subtle muted background + border by default, filled when active
        "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
        // default appearance: subtle bg + border
        "bg-muted/5 text-foreground border border-muted/20 hover:bg-muted/10",
        // active appearance: filled background, highlighted border and shadow
        "data-[state=active]:bg-popover data-[state=active]:text-foreground data-[state=active]:shadow-md border-input",
        // focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
