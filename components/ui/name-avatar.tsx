import { cn } from "@/lib/utils";

// Brand-adjacent pastels (coral/peach/cream family) plus quiet accents.
// A name deterministically maps to one of these as the avatar background.
const BACKGROUNDS = [
  "ffe5d1", "fbd7b9", "ffddd3", "fff3e4",
  "ffe9ec", "eaf6ee", "e8f1fa", "f3eefa",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function avatarUrl(name: string): string {
  const seed = name.trim() || "?";
  const bg = BACKGROUNDS[hash(seed.toLowerCase()) % BACKGROUNDS.length];
  const params = new URLSearchParams({
    seed,
    backgroundColor: bg,
    backgroundType: "solid",
  });
  return `https://api.dicebear.com/10.x/initial-face/svg?${params}`;
}

export function NameAvatar({
  name,
  className,
  size = "sm",
}: {
  name: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external SVG avatar service
    <img
      src={avatarUrl(name || "?")}
      alt={`${name} avatar`}
      title={name}
      loading="lazy"
      className={cn(
        "shrink-0 rounded-full select-none",
        size === "sm" ? "size-8" : "size-14",
        className
      )}
    />
  );
}