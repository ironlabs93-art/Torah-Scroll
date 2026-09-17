import { db } from "./db";
import { getDailyLearning, slugify, type DailyLearning } from "./calendar";
import { fetchText, excerpt, httpFetcher, type Fetcher } from "./sefaria";

/** The account imported texts are posted under. */
export const LIBRARY_HANDLE = "sefaria";

export async function ensureLibraryAccount(): Promise<string> {
  const existing = await db.user.findUnique({ where: { handle: LIBRARY_HANDLE }, select: { id: true } });
  if (existing) return existing.id;

  const user = await db.user.create({
    data: {
      handle: LIBRARY_HANDLE,
      name: "Daily Texts",
      email: "library@torahscroll.local",
      // No one signs in as this account; it exists to own imported rows.
      passwordHash: "x",
      bio: "Today's daf, today's mishnayos and this week's parsha, pulled from Sefaria's open library.",
      kind: "ORG",
      verified: true,
      avatarHue: 216,
      onboarded: true,
    },
  });
  return user.id;
}

type Plan = {
  key: string;
  work: string;
  ref: string;
  title: string;
  lede: string;
  tags: string[];
};

/** What to pull for a given day. */
export function importPlan(cal: DailyLearning): Plan[] {
  const plans: Plan[] = [
    {
      key: `daf:${cal.gregorian}`,
      work: cal.dafYomi.work,
      ref: cal.dafYomi.ref + "a",
      title: `Today's daf: ${cal.dafYomi.display}`,
      lede: "The opening of today's amud, in Hebrew and in translation.",
      tags: ["daf-yomi"],
    },
  ];

  if (cal.mishnaYomi) {
    plans.push({
      key: `mishnah:${cal.gregorian}`,
      work: cal.mishnaYomi.work,
      ref: cal.mishnaYomi.ref,
      title: `Today's Mishnah Yomi: ${cal.mishnaYomi.display}`,
      lede: "Today's mishnayos in full. Four minutes, start to finish.",
      tags: ["mishnah-yomi", "beginner-friendly"],
    });
  }

  if (cal.parsha && cal.parshaSlug) {
    plans.push({
      key: `parsha:${cal.hebrewYear}:${cal.parshaSlug}`,
      // A parsha name is itself a valid Sefaria ref; there is no section
      // number to append, and excerpt() trims the passage for the card.
      work: cal.parsha.split("-")[0],
      ref: "",
      title: `Parshas ${cal.parsha}`,
      lede: "The opening of this week's sedra.",
      tags: ["parsha", cal.parshaSlug, "chumash"],
    });
  }

  return plans;
}

export type ImportResult = { created: number; updated: number; skipped: number; failed: string[] };

/**
 * Pulls the day's texts and writes them as posts. Safe to run repeatedly: each
 * post is keyed by externalId, so a second run updates rather than duplicates.
 */
export async function importDailyTexts(opts: {
  date?: Date;
  fetcher?: Fetcher;
} = {}): Promise<ImportResult> {
  const cal = getDailyLearning(opts.date ?? new Date());
  const fetcher = opts.fetcher ?? httpFetcher;
  const authorId = await ensureLibraryAccount();
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, failed: [] };

  for (const plan of importPlan(cal)) {
    const externalId = `sefaria:${plan.key}`;
    const text = await fetchText(plan.work, plan.ref, fetcher);

    if (!text) {
      result.failed.push(`${plan.work} ${plan.ref}`);
      continue;
    }

    const en = excerpt(text.en);
    const he = excerpt(text.he, 700);
    const parts = [plan.lede];
    if (he.body) parts.push(he.body);
    if (en.body) parts.push(en.body);
    if (en.truncated || he.truncated) parts.push("Continue on Sefaria for the rest.");

    const data = {
      authorId,
      type: "TEXT",
      title: plan.title,
      body: parts.join("\n\n"),
      sourceWork: plan.work,
      sourceRef: plan.ref,
      sourceUrl: text.url,
      sourceName: text.versionTitle
        ? `${text.versionTitle}${text.license ? ` (${text.license})` : ""}`
        : "Sefaria",
      origin: "IMPORT",
      externalId,
    };

    const existing = await db.post.findUnique({ where: { externalId }, select: { id: true } });
    if (existing) {
      await db.post.update({ where: { id: existing.id }, data });
      result.updated++;
      continue;
    }

    const post = await db.post.create({ data });
    const tagIds = await Promise.all(plan.tags.map(ensureTag));
    await db.postTag.createMany({ data: tagIds.map((tagId) => ({ postId: post.id, tagId })) });
    result.created++;
  }

  return result;
}

async function ensureTag(slug: string): Promise<string> {
  const existing = await db.tag.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;
  const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const created = await db.tag.create({ data: { slug: slugify(slug), label, kind: "SOURCE" } });
  return created.id;
}

/**
 * Called on feed render. Runs the import at most once a day and never blocks
 * the page: a reader should get their feed whether or not Sefaria is reachable.
 */
let inFlight: Promise<unknown> | null = null;

export async function refreshDailyTextsInBackground(date = new Date()) {
  if (inFlight) return;
  if (process.env.DISABLE_TEXT_IMPORT === "1") return;

  const cal = getDailyLearning(date);
  const marker = `sefaria:daf:${cal.gregorian}`;
  const already = await db.post.findUnique({ where: { externalId: marker }, select: { id: true } });
  if (already) return;

  inFlight = importDailyTexts({ date })
    .then((r) => {
      if (r.created || r.failed.length) {
        console.log(`[sefaria] imported ${r.created}, failed ${r.failed.length}`);
      }
    })
    .catch((err) => console.error("[sefaria] import failed:", err))
    .finally(() => {
      inFlight = null;
    });
}
