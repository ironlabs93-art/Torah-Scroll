/**
 * Subscribable channels.
 *
 * Three kinds, one interface:
 *  - YOUTUBE      a channel's public Atom feed. No API key, no quota.
 *  - RSS          any RSS or Atom feed: a podcast, a shiur series, a blog.
 *  - BUILTIN_TEXT the daily texts this app assembles itself (lib/daily-import).
 *
 * What is imported, deliberately, is metadata: a title, a description, a
 * publication date and a link. Media is never copied. A YouTube item plays
 * through YouTube's own embed, which is what embeds are for and sends the view
 * back to the creator; a podcast item links out to the publisher. Copying
 * someone's audio or article body into this database would be a different act
 * entirely, and not one this file performs.
 *
 * Network access is injected so parsing is testable offline. See
 * scripts/check-sources.mts.
 */
import { XMLParser } from "fast-xml-parser";

export const SOURCE_KINDS = ["YOUTUBE", "RSS", "BUILTIN_TEXT"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export type FeedItem = {
  /** Stable id from the feed, used to avoid re-importing the same item. */
  guid: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: Date | null;
  /** Present for YouTube items, so the card can embed the player. */
  videoUrl: string | null;
};

export type TextFetcher = (url: string) => Promise<string>;

export const httpTextFetcher: TextFetcher = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml",
        "User-Agent": "TorahScroll/0.1 (proof of concept; feed reader)",
      },
    });
    if (!res.ok) throw new Error(`${res.status} from ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
};

/** A YouTube channel exposes its uploads as Atom at a fixed address. */
export function youtubeFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

/**
 * Pulls a channel id out of whatever someone pasted. A /channel/UC... URL
 * carries it directly; @handle and /c/ vanity URLs do not, and resolving those
 * needs a request, so those are rejected with a message rather than guessed at.
 */
export function parseChannelId(input: string): { channelId: string } | { error: string } {
  const raw = input.trim();
  if (/^UC[\w-]{20,}$/.test(raw)) return { channelId: raw };

  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "youtu.be") {
      return { error: "That is not a YouTube URL." };
    }
    const m = u.pathname.match(/\/channel\/(UC[\w-]{20,})/);
    if (m) return { channelId: m[1] };
    const id = u.searchParams.get("channel_id");
    if (id && /^UC[\w-]{20,}$/.test(id)) return { channelId: id };
    if (/\/(@|c\/|user\/)/.test(u.pathname)) {
      return {
        error:
          "That is a handle or vanity URL, which does not contain the channel id. Open the channel, view source and copy the UC... id, or paste a /channel/UC... link.",
      };
    }
  } catch {
    /* not a URL */
  }
  return { error: "Paste a YouTube channel id (starts with UC) or a /channel/UC... link." };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  // Feeds are inconsistent about whether a single child is an array.
  isArray: (name) => name === "entry" || name === "item",
  processEntities: true,
  trimValues: true,
});

function text(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "#text" in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>)["#text"] ?? "");
  }
  return "";
}

function stripTags(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toDate(value: unknown): Date | null {
  const raw = text(value);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Atom `<link rel="alternate" href>`, in any of the shapes feeds use. */
function atomLink(entry: Record<string, unknown>): string {
  const link = entry.link;
  const candidates = Array.isArray(link) ? link : [link];
  for (const c of candidates) {
    if (typeof c === "string" && c) return c;
    if (c && typeof c === "object") {
      const rec = c as Record<string, unknown>;
      const rel = String(rec["@rel"] ?? "alternate");
      const href = String(rec["@href"] ?? "");
      if (href && rel === "alternate") return href;
    }
  }
  for (const c of candidates) {
    if (c && typeof c === "object") {
      const href = String((c as Record<string, unknown>)["@href"] ?? "");
      if (href) return href;
    }
  }
  return "";
}

/**
 * Parses Atom or RSS. YouTube's feed is Atom with a media:group; podcasts are
 * usually RSS with an enclosure. Both reduce to the same FeedItem.
 */
export function parseFeed(xml: string, opts: { youtube?: boolean } = {}): FeedItem[] {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return [];
  }

  const feed = doc.feed as Record<string, unknown> | undefined;
  const rss = doc.rss as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;

  const entries = (feed?.entry ?? channel?.item ?? []) as Record<string, unknown>[];
  if (!Array.isArray(entries)) return [];

  const out: FeedItem[] = [];
  for (const e of entries) {
    const media = (e["media:group"] ?? {}) as Record<string, unknown>;

    const videoId = text(e["yt:videoId"]);
    const url = atomLink(e) || text(e.link) || text(e.guid);
    const title = stripTags(text(e.title) || text(media["media:title"]));
    const summary = stripTags(
      text(media["media:description"]) ||
        text(e.summary) ||
        text(e.description) ||
        text(e["content:encoded"]) ||
        text(e.content)
    );
    const guid =
      (videoId && `yt:${videoId}`) ||
      text(e.id) ||
      text(e.guid) ||
      url ||
      title;

    if (!guid || !title) continue;

    const isYoutube = Boolean(opts.youtube || videoId);
    out.push({
      guid,
      title,
      summary,
      url: url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ""),
      publishedAt: toDate(e.published) ?? toDate(e.pubDate) ?? toDate(e.updated),
      videoUrl: isYoutube
        ? videoId
          ? `https://www.youtube.com/watch?v=${videoId}`
          : url || null
        : null,
    });
  }
  return out;
}

export async function fetchFeed(
  kind: SourceKind,
  feedRef: string,
  fetcher: TextFetcher = httpTextFetcher
): Promise<{ items: FeedItem[]; error?: string }> {
  if (kind === "BUILTIN_TEXT") return { items: [] };
  const url = kind === "YOUTUBE" ? youtubeFeedUrl(feedRef) : feedRef;
  try {
    const xml = await fetcher(url);
    return { items: parseFeed(xml, { youtube: kind === "YOUTUBE" }) };
  } catch (err) {
    return { items: [], error: err instanceof Error ? err.message : String(err) };
  }
}
