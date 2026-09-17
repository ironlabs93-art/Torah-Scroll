export function timeAgo(date: Date): string {
  const secs = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 6) return `${weeks}w`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Pull a YouTube or Vimeo id out of a pasted URL so it can be embedded. */
export function parseVideo(url: string): { provider: "youtube" | "vimeo"; id: string } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id ? { provider: "youtube", id } : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? { provider: "youtube", id } : null;
      }
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]+)/);
      if (m) return { provider: "youtube", id: m[2] };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const m = u.pathname.match(/(\d{6,})/);
      if (m) return { provider: "vimeo", id: m[1] };
    }
  } catch {
    return null;
  }
  return null;
}

export function embedUrl(v: { provider: "youtube" | "vimeo"; id: string }): string {
  return v.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${v.id}`
    : `https://player.vimeo.com/video/${v.id}`;
}

/** Link to the source on Sefaria when the reference looks resolvable. */
export function sefariaUrl(work?: string | null, ref?: string | null): string | null {
  if (!work) return null;
  const w = work.trim().replace(/\s+/g, "_");
  return ref ? `https://www.sefaria.org/${w}.${ref.trim()}` : `https://www.sefaria.org/${w}`;
}

/**
 * True when a paragraph should be laid out right to left.
 *
 * Counts letters rather than merely detecting Hebrew: an English sentence that
 * quotes תיקו is still English and must not flip. A Gemara passage, where the
 * Hebrew dominates, should.
 */
export function isHebrewParagraph(text: string): boolean {
  const hebrew = (text.match(/[\u0590-\u05FF]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return hebrew > 0 && hebrew >= latin;
}
