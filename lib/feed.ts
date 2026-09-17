import { db } from "./db";
import { getDailyLearning, type DailyLearning, slugify } from "./calendar";

export type FeedReason = { label: string; kind: "calendar" | "follow" | "affinity" | "popular" | "fresh" };

export type FeedPost = Awaited<ReturnType<typeof loadCandidates>>[number] & {
  score: number;
  reasons: FeedReason[];
  hearted: boolean;
  answered: { choice: number; correct: boolean } | null;
};

const DAY = 1000 * 60 * 60 * 24;

/**
 * Weights are deliberately plain numbers rather than a learned model. A Torah
 * feed should be able to tell you why something reached you, so every term
 * here maps to a reason string the card can display.
 */
const W = {
  dafExact: 62,
  dafMasechta: 20,
  mishnaExact: 55,
  parsha: 44,
  holiday: 48,
  follow: 26,
  affinity: 9,
  affinityCap: 36,
  recencyMax: 20,
  recencyHalfLifeDays: 3,
  heart: 2.6,
  comment: 4.2,
  seenDecay: 0.62,
  seenFloor: 0.25,
  ownPost: -18,
};

async function loadCandidates(limit: number) {
  return db.post.findMany({
    where: { status: "LIVE" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      author: {
        select: { id: true, name: true, handle: true, kind: true, verified: true, avatarHue: true },
      },
      tags: { include: { tag: true } },
    },
  });
}

function normalizeRef(ref: string | null | undefined) {
  return (ref ?? "").toLowerCase().replace(/[ab]$/, "").trim();
}

function matchesWork(postWork: string | null | undefined, calWork: string) {
  if (!postWork) return false;
  return slugify(postWork) === slugify(calWork);
}

export type FeedMode = "foryou" | "today" | "following";

export async function buildFeed(opts: {
  userId: string | null;
  mode: FeedMode;
  limit?: number;
  now?: Date;
}): Promise<{ posts: FeedPost[]; calendar: DailyLearning }> {
  const { userId, mode } = opts;
  const now = opts.now ?? new Date();
  const limit = opts.limit ?? 30;
  const calendar = getDailyLearning(now);

  const [candidates, following, affinities, hearts, answers, impressions] = await Promise.all([
    loadCandidates(400),
    userId
      ? db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } })
      : Promise.resolve([]),
    userId
      ? db.tagAffinity.findMany({ where: { userId }, include: { tag: true } })
      : Promise.resolve([]),
    userId ? db.heart.findMany({ where: { userId }, select: { postId: true } }) : Promise.resolve([]),
    userId
      ? db.quizResponse.findMany({ where: { userId }, select: { postId: true, choice: true, correct: true } })
      : Promise.resolve([]),
    userId
      ? db.impression.findMany({ where: { userId }, select: { postId: true, count: true } })
      : Promise.resolve([]),
  ]);

  const followSet = new Set(following.map((f) => f.followingId));
  const heartSet = new Set(hearts.map((h) => h.postId));
  const answerMap = new Map(answers.map((a) => [a.postId, { choice: a.choice, correct: a.correct }]));
  const seenMap = new Map(impressions.map((i) => [i.postId, i.count]));
  const affinityMap = new Map(affinities.map((a) => [a.tag.slug, a.score]));

  const holidayProximity = new Map(calendar.upcomingHolidays.map((h) => [h.slug, h]));

  const scored: FeedPost[] = candidates.map((post) => {
    const reasons: FeedReason[] = [];
    let score = 0;
    const tagSlugs = post.tags.map((t) => t.tag.slug);

    // --- Calendar: what the world is learning today -----------------------
    const daf = calendar.dafYomi;
    if (matchesWork(post.sourceWork, daf.work)) {
      if (normalizeRef(post.sourceRef) === normalizeRef(daf.ref)) {
        score += W.dafExact;
        reasons.push({ kind: "calendar", label: `Today's daf · ${daf.display}` });
      } else {
        score += W.dafMasechta;
        reasons.push({ kind: "calendar", label: `You're in ${daf.work} this cycle` });
      }
    }

    const mishna = calendar.mishnaYomi;
    if (mishna && matchesWork(post.sourceWork, mishna.work)) {
      const postCh = normalizeRef(post.sourceRef).split(":")[0];
      const calCh = normalizeRef(mishna.ref).split(":")[0];
      if (postCh && postCh === calCh) {
        score += W.mishnaExact;
        reasons.push({ kind: "calendar", label: `Today's Mishnah Yomi · ${mishna.display}` });
      }
    }

    if (calendar.parshaSlug && tagSlugs.includes(calendar.parshaSlug)) {
      score += W.parsha;
      reasons.push({ kind: "calendar", label: `This week: Parshas ${calendar.parsha}` });
    }

    for (const slug of tagSlugs) {
      const hol = holidayProximity.get(slug);
      if (!hol) continue;
      const nearness = 1 - hol.daysAway / 12;
      score += W.holiday * nearness;
      reasons.push({
        kind: "calendar",
        label: hol.daysAway === 0 ? `${hol.label}, today` : `${hol.label} in ${hol.daysAway} day${hol.daysAway === 1 ? "" : "s"}`,
      });
      break;
    }

    // --- Who you follow ----------------------------------------------------
    if (followSet.has(post.authorId)) {
      score += W.follow;
      reasons.push({ kind: "follow", label: `You follow ${post.author.name}` });
    }

    // --- What you've engaged with -----------------------------------------
    let affinityScore = 0;
    let topTag: string | null = null;
    let topVal = 0;
    for (const t of post.tags) {
      const v = affinityMap.get(t.tag.slug) ?? 0;
      affinityScore += v;
      if (v > topVal) {
        topVal = v;
        topTag = t.tag.label;
      }
    }
    if (affinityScore > 0) {
      const applied = Math.min(affinityScore * W.affinity, W.affinityCap);
      score += applied;
      if (topTag && applied > 6) {
        reasons.push({ kind: "affinity", label: `You've been learning ${topTag}` });
      }
    }

    // --- Freshness ---------------------------------------------------------
    const ageDays = Math.max(0, (now.getTime() - post.createdAt.getTime()) / DAY);
    const recency = W.recencyMax * Math.pow(0.5, ageDays / W.recencyHalfLifeDays);
    score += recency;
    if (ageDays < 1 && reasons.length === 0) {
      reasons.push({ kind: "fresh", label: "Posted today" });
    }

    // Comments count for more than hearts. A conversation about a sugya is
    // worth more than a tap, which is the whole point of this app.
    const engagement =
      Math.log1p(post.heartCount) * W.heart + Math.log1p(post.commentCount) * W.comment;
    score += engagement;
    if (reasons.length === 0 && post.heartCount + post.commentCount > 6) {
      reasons.push({ kind: "popular", label: "People are learning this" });
    }

    // --- Dampers -----------------------------------------------------------
    const seenCount = seenMap.get(post.id) ?? 0;
    if (seenCount > 0) {
      // Seen-before posts sink, but never all the way out. Something tied to
      // today's daf is still today's daf on your second look at the feed, so
      // calendar matches get a higher floor than everything else.
      const floor = reasons.some((r) => r.kind === "calendar") ? 0.55 : W.seenFloor;
      score *= Math.max(floor, Math.pow(W.seenDecay, seenCount));
    }
    if (userId && post.authorId === userId) score += W.ownPost;

    return {
      ...post,
      score,
      reasons: reasons.slice(0, 2),
      hearted: heartSet.has(post.id),
      answered: answerMap.get(post.id) ?? null,
    };
  });

  let result: FeedPost[];
  if (mode === "following") {
    result = scored
      .filter((p) => followSet.has(p.authorId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (mode === "today") {
    result = scored
      .filter((p) => p.reasons.some((r) => r.kind === "calendar"))
      .sort((a, b) => b.score - a.score);
  } else {
    result = scored.sort((a, b) => b.score - a.score);
    result = diversify(result);
  }

  return { posts: result.slice(0, limit), calendar };
}

/**
 * Keeps one author or one post type from taking over the top of the feed.
 * Walks the ranked list and defers a post that would be the third in a row
 * from the same author or the same format.
 */
function diversify(posts: FeedPost[]): FeedPost[] {
  const out: FeedPost[] = [];
  const held: FeedPost[] = [];
  const pool = [...posts];

  while (pool.length || held.length) {
    const next = pool.shift() ?? held.shift();
    if (!next) break;
    const lastTwo = out.slice(-2);
    const sameAuthor = lastTwo.length === 2 && lastTwo.every((p) => p.authorId === next.authorId);
    const sameType = lastTwo.length === 2 && lastTwo.every((p) => p.type === next.type);
    if ((sameAuthor || sameType) && pool.length) {
      held.push(next);
      continue;
    }
    out.push(next);
    if (held.length && pool.length === 0) {
      out.push(...held.splice(0));
    }
  }
  return out;
}

/** Nudge a user's tag weights after they engage with a post. */
export async function bumpAffinity(userId: string, postId: string, delta: number) {
  const tags = await db.postTag.findMany({ where: { postId }, select: { tagId: true } });
  await Promise.all(
    tags.map((t) =>
      db.tagAffinity.upsert({
        where: { userId_tagId: { userId, tagId: t.tagId } },
        create: { userId, tagId: t.tagId, score: delta },
        update: { score: { increment: delta } },
      })
    )
  );
}

/** Rapid refreshes shouldn't count as separate views. */
const IMPRESSION_DEDUPE_MS = 10 * 60 * 1000;

/**
 * Best-effort. This is feed bookkeeping, not content: if it fails, the reader
 * should still get their feed, so nothing here is allowed to throw upward.
 */
export async function recordImpressions(userId: string, postIds: string[]) {
  if (!postIds.length) return;
  try {
    await writeImpressions(userId, postIds);
  } catch (err) {
    console.error("recordImpressions failed", err);
  }
}

async function writeImpressions(userId: string, postIds: string[]) {
  const now = new Date();
  const existing = await db.impression.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true, lastSeen: true },
  });
  const seenRecently = new Set(
    existing
      .filter((i) => now.getTime() - i.lastSeen.getTime() < IMPRESSION_DEDUPE_MS)
      .map((i) => i.postId)
  );

  await Promise.all(
    postIds.map((postId) =>
      db.impression.upsert({
        where: { userId_postId: { userId, postId } },
        create: { userId, postId, count: 1 },
        update: seenRecently.has(postId)
          ? { lastSeen: now }
          : { count: { increment: 1 }, lastSeen: now },
      })
    )
  );
}
