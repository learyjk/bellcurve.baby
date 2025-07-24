export const words = [
  "baby",
  "guess",
  "pool",
  "guess",
  "sweep",
  "game",
  "challenge",
  "contest",
  "picks",
  "party",
  "fun",
  "squad",
  "crew",
  "club",
  "mania",
  "bash",
  "fest",
  "vibes",
  "watch",
  "arrival",
  "bundle",
  "joy",
  "bloom",
  "bloomers",
  "sprout",
  "cutie",
  "cuties",
  "love",
  "joyride",
  "time",
  "moment",
  "magic",
  "future",
  "winner",
  "champ",
  "legend",
  "star",
  "dreams",
  "wishes",
  "hope",
  "miracle",
  "guessers",
  "squadron",
  "family",
  "friends",
  "circle",
  "journey",
  "adventure",
  "welcome",
  "celebration",
];

export function formatSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateSlugSuggestions(base: string, babyName: string) {
  const name = (babyName || "baby").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!name) return [];
  const suggestions = [
    `baby${name}`,
    `${name}guess`,
    `${name}pool`,
    `${name}guess`,
    `${name}family`,
    `${name}game`,
    `${name}club`,
    `${name}challenge`,
    `${name}party`,
    `${name}mania`,
    `${name}crew`,
    `${name}friends`,
    `${name}circle`,
    `${name}adventure`,
    `${name}arrival`,
    `${name}bloom`,
    `${name}star`,
    `${name}winner`,
    `${name}champ`,
    `${name}miracle`,
    `${name}joy`,
    `${name}future`,
    `${name}moment`,
    `${name}magic`,
    `${name}hope`,
    `${name}legend`,
    `${name}dreams`,
    `${name}wishes`,
    `${name}cutie`,
    `${name}sprout`,
    `${name}bloomers`,
    `${name}watch`,
    `${name}vibes`,
    `${name}squad`,
    `${name}squadron`,
    `${name}picks`,
    `${name}joyride`,
    `${name}time`,
    `${name}welcome`,
    `${name}celebration`,
    `${name}bash`,
    `${name}fest`,
    `${name}bundle`,
    `${name}cuties`,
    `${name}love`,
    `${name}friends`,
    `${name}club`,
    `${name}pool`,
    `${name}guessers`,
  ];
  for (let i = 0; i < 8; i++) {
    const word = words[Math.floor(Math.random() * words.length)];
    suggestions.push(`${name}${word}`);
    suggestions.push(`${word}${name}`);
  }
  const unique = suggestions.filter((s, i, arr) => s && arr.indexOf(s) === i);
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique.slice(0, 4);
}
