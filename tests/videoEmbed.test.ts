import { describe, it, expect } from "vitest";
import { getVideoEmbed } from "../lib/helpers/videoEmbed";

const YT = "dQw4w9WgXcQ"; // canonical 11-char YouTube id

describe("getVideoEmbed — YouTube", () => {
  it("parses watch URLs", () => {
    const r = getVideoEmbed(`https://www.youtube.com/watch?v=${YT}`);
    expect(r?.provider).toBe("youtube");
    expect(r?.videoId).toBe(YT);
  });

  it("parses youtu.be share URLs", () => {
    expect(getVideoEmbed(`https://youtu.be/${YT}`)?.videoId).toBe(YT);
  });

  it("parses shorts, live, and embed URLs", () => {
    expect(getVideoEmbed(`https://youtube.com/shorts/${YT}`)?.videoId).toBe(YT);
    expect(getVideoEmbed(`https://youtube.com/live/${YT}`)?.videoId).toBe(YT);
    expect(getVideoEmbed(`https://youtube.com/embed/${YT}`)?.videoId).toBe(YT);
  });

  it("parses music.youtube.com and bare IDs", () => {
    expect(getVideoEmbed(`https://music.youtube.com/watch?v=${YT}`)?.videoId).toBe(YT);
    expect(getVideoEmbed(YT)?.videoId).toBe(YT);
  });

  it("tolerates a missing scheme", () => {
    expect(getVideoEmbed(`youtube.com/watch?v=${YT}`)?.videoId).toBe(YT);
  });

  it("uses the privacy-enhanced nocookie embed domain", () => {
    const r = getVideoEmbed(`https://youtube.com/watch?v=${YT}`);
    expect(r?.embedUrl).toBe(`https://www.youtube-nocookie.com/embed/${YT}?rel=0`);
  });

  it("rejects malformed YouTube IDs", () => {
    expect(getVideoEmbed("https://youtube.com/watch?v=too-short")).toBeNull();
    expect(getVideoEmbed("https://youtu.be/")).toBeNull();
  });
});

describe("getVideoEmbed — Vimeo", () => {
  it("parses vimeo.com and player.vimeo.com URLs", () => {
    expect(getVideoEmbed("https://vimeo.com/123456789")?.videoId).toBe("123456789");
    expect(getVideoEmbed("https://player.vimeo.com/video/123456789")?.videoId).toBe("123456789");
  });

  it("parses bare numeric IDs", () => {
    const r = getVideoEmbed("123456789");
    expect(r?.provider).toBe("vimeo");
    expect(r?.embedUrl).toBe("https://player.vimeo.com/video/123456789");
  });

  it("rejects too-short numeric IDs", () => {
    expect(getVideoEmbed("https://vimeo.com/12345")).toBeNull();
  });
});

describe("getVideoEmbed — safety", () => {
  it("returns null for unsupported hosts", () => {
    expect(getVideoEmbed("https://example.com/video/abc")).toBeNull();
    expect(getVideoEmbed("https://tiktok.com/@user/video/123")).toBeNull();
  });

  it("returns null for dangerous schemes and garbage", () => {
    expect(getVideoEmbed("javascript:alert(1)")).toBeNull();
    expect(getVideoEmbed("not a url at all !!!")).toBeNull();
    expect(getVideoEmbed("")).toBeNull();
    expect(getVideoEmbed(null)).toBeNull();
    expect(getVideoEmbed(undefined)).toBeNull();
  });
});
