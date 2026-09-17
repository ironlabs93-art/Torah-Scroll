/**
 * Sefaria text import.
 *
 * The point of this module is that the feed has a floor: today's daf, today's
 * mishnayos and this week's parsha are in the feed whether or not a single
 * person posted. Without it, a quiet week means an empty app.
 *
 * Sefaria's API is public and needs no key. Licensing varies per text version:
 * public-domain works are unrestricted, and several modern translations are
 * CC-BY or CC-BY-NC. `versionTitle` and `license` come back with every
 * response and are stored so the card can attribute properly. Check the
 * license before using any of this commercially.
 *
 * Network access is injected rather than called directly so the parsing can be
 * tested against fixtures. See scripts/check-sefaria.mts.
 */

export const SEFARIA_BASE = "https://www.sefaria.org";

export type SefariaText = {
  ref: string;
  /** English lines, HTML stripped. */
  en: string[];
  /** Hebrew lines, HTML stripped. */
  he: string[];
  versionTitle: string | null;
  license: string | null;
  url: string;
};

export type Fetcher = (url: string) => Promise<unknown>;

/** Default fetcher, with a timeout so a slow upstream can't hang a page render. */
export const httpFetcher: Fetcher = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "TorahScroll/0.1 (proof of concept)" },
    });
    if (!res.ok) throw new Error(`Sefaria responded ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

/** Sefaria returns HTML in text bodies: footnotes, italics, line breaks. */
export function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Text bodies arrive as a string, an array, or an array of arrays. */
function flatten(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) out.push(...flatten(item));
  return out;
}

function clean(value: unknown): string[] {
  return flatten(value)
    .map(stripHtml)
    .filter((line) => line.length > 0);
}

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;

/**
 * Parses either API generation:
 *  - v3 puts bodies under `versions[]`, each tagged with a language.
 *  - v1 puts English on `text` and Hebrew on `he` at the top level.
 * Both are handled because which one a deployment sees depends on the endpoint
 * that answered, and guessing wrong would silently produce empty cards.
 */
export function parseText(payload: unknown, fallbackRef: string): SefariaText | null {
  if (!isRecord(payload)) return null;

  const ref = typeof payload.ref === "string" ? payload.ref : fallbackRef;
  let en: string[] = [];
  let he: string[] = [];
  let versionTitle: string | null = null;
  let license: string | null = null;

  const versions = payload.versions;
  if (Array.isArray(versions) && versions.length) {
    for (const v of versions) {
      if (!isRecord(v)) continue;
      const lang = String(v.language ?? v.actualLanguage ?? "").toLowerCase();
      const body = clean(v.text);
      if (!body.length) continue;
      if (lang.startsWith("he")) {
        if (!he.length) he = body;
      } else if (!en.length) {
        en = body;
        versionTitle = typeof v.versionTitle === "string" ? v.versionTitle : versionTitle;
        license = typeof v.license === "string" ? v.license : license;
      }
    }
  }

  if (!en.length) en = clean(payload.text);
  if (!he.length) he = clean(payload.he);
  if (!versionTitle && typeof payload.versionTitle === "string") versionTitle = payload.versionTitle;
  if (!license && typeof payload.license === "string") license = payload.license;

  if (!en.length && !he.length) return null;

  return {
    ref,
    en,
    he,
    versionTitle,
    license,
    url: `${SEFARIA_BASE}/${encodeURIComponent(ref.replace(/\s+/g, "_"))}`,
  };
}

/**
 * Sefaria refs use underscores for spaces and carry no apostrophes: the sedra
 * we call Ha'azinu is "Haazinu" there, and Tish'a B'Av is "Tisha BAv". Passing
 * the punctuated form back gets a 404, so strip it here rather than at every
 * call site.
 */
export function toSefariaRef(work: string, ref: string): string {
  const w = work.trim().replace(/['\u2019]/g, "").replace(/\s+/g, "_");
  const r = ref.trim().replace(/['\u2019]/g, "").replace(/\s+/g, ".");
  return r ? `${w}.${r}` : w;
}

export async function fetchText(
  work: string,
  ref: string,
  fetcher: Fetcher = httpFetcher
): Promise<SefariaText | null> {
  const sref = toSefariaRef(work, ref);
  const url = `${SEFARIA_BASE}/api/v3/texts/${sref}?return_format=text_only`;
  try {
    return parseText(await fetcher(url), `${work} ${ref}`);
  } catch (err) {
    console.error(`[sefaria] ${sref} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Trim a long passage to something that belongs in a feed card. */
export function excerpt(lines: string[], maxChars = 900): { body: string; truncated: boolean } {
  const out: string[] = [];
  let total = 0;
  for (const line of lines) {
    if (total + line.length > maxChars && out.length) return { body: out.join("\n\n"), truncated: true };
    out.push(line);
    total += line.length;
  }
  return { body: out.join("\n\n"), truncated: out.length < lines.length };
}
