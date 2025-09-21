"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(var(--background))",
          "--normal-text": "hsl(var(--foreground))",
          "--normal-border": "hsl(var(--border))",
          "--error-bg": "hsl(var(--destructive))",
          "--error-text": "hsl(var(--destructive-foreground))",
          "--success-bg": "hsl(var(--primary))",
          "--success-text": "hsl(var(--primary-foreground))",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        classNames: {
          error:
            "!bg-destructive !text-destructive-foreground !border-destructive",
          success: "!bg-white !text-primary-foreground",
          warning: "!bg-secondary !text-secondary-foreground !border-secondary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
