// Helpers for turning user-supplied video URLs into safe embeddable URLs.
// Supported: YouTube (watch/share/embed/shorts/live) and Vimeo.
// Anything else returns null so we never render arbitrary iframes.

export type VideoEmbed = {
  provider: "youtube" | "vimeo";
  embedUrl: string;
  videoId: string;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{6,12}$/;

function youtubeEmbed(id: string): VideoEmbed {
  // youtube-nocookie domain for privacy-enhanced mode; rel=0 limits related videos.
  return {
    provider: "youtube",
    videoId: id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
  };
}

function vimeoEmbed(id: string): VideoEmbed {
  return {
    provider: "vimeo",
    videoId: id,
    embedUrl: `https://player.vimeo.com/video/${id}`,
  };
}

/**
 * Parse a user-provided video URL into an embeddable URL.
 * Accepts:
 *  - YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID,
 *    youtube.com/shorts/ID, youtube.com/live/ID, music.youtube.com/watch?v=ID
 *  - Vimeo: vimeo.com/ID, player.vimeo.com/video/ID
 *  - A bare 11-char YouTube ID or numeric Vimeo ID (no scheme)
 * Returns null if the input can't be recognized as a supported video.
 */
export function getVideoEmbed(
  input: string | null | undefined
): VideoEmbed | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // Bare IDs, no URL parsing needed.
  if (YOUTUBE_ID.test(raw)) return youtubeEmbed(raw);
  if (VIMEO_ID.test(raw)) return vimeoEmbed(raw);

  let url: URL;
  try {
    // Tolerate missing scheme, e.g. "youtube.com/watch?v=..."
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\.|^m\./, "");

  // --- YouTube ---
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (YOUTUBE_ID.test(id)) return youtubeEmbed(id);
    return null;
  }
  if (
    host === "youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "music.youtube.com"
  ) {
    // /watch?v=ID
    const v = url.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) return youtubeEmbed(v);
    // /embed/ID, /shorts/ID, /live/ID, /v/ID
    const parts = url.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "live", "v"].includes(parts[0])) {
      const id = parts[1] ?? "";
      if (YOUTUBE_ID.test(id)) return youtubeEmbed(id);
    }
    return null;
  }

  // --- Vimeo ---
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (VIMEO_ID.test(id)) return vimeoEmbed(id);
    return null;
  }
  if (host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "video" && VIMEO_ID.test(parts[1] ?? "")) {
      return vimeoEmbed(parts[1]);
    }
    return null;
  }

  return null;
}
