import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_TAGS } from "../lib/taxonomy.js";
import { getDailyLearning } from "../lib/calendar.js";
import { ACCOUNTS, EVERGREEN, COMMENTS, calendarContent, type SeedPost } from "./seed-content.js";
import { SOURCE_CATALOG } from "../lib/source-catalog.js";

const db = new PrismaClient();
const DAY = 1000 * 60 * 60 * 24;
const now = Date.now();
const at = (ago: number) => new Date(now - ago * DAY);

/** Deterministic pseudo-random so a reseed produces the same feed. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

async function main() {
  console.log("Clearing existing data...");
  await db.source.deleteMany();
  await db.moderationAction.deleteMany();
  await db.flag.deleteMany();
  await db.impression.deleteMany();
  await db.tagAffinity.deleteMany();
  await db.quizResponse.deleteMany();
  await db.heart.deleteMany();
  await db.comment.deleteMany();
  await db.postTag.deleteMany();
  await db.post.deleteMany();
  await db.follow.deleteMany();
  await db.tag.deleteMany();
  await db.user.deleteMany();

  const cal = getDailyLearning();
  console.log(
    `Seeding against ${cal.hebrewDate} - daf ${cal.dafYomi.display}, parsha ${cal.parsha ?? "(chag)"}`
  );

  console.log("Tags...");
  const tagIds = new Map<string, string>();
  for (const t of ALL_TAGS) {
    const tag = await db.tag.create({
      data: { slug: t.slug, label: t.label, hebrew: t.hebrew, kind: t.kind },
    });
    tagIds.set(t.slug, tag.id);
  }

  // Parsha tags are created on demand so any week's sedra can be tagged.
  async function ensureTag(slug: string): Promise<string> {
    const existing = tagIds.get(slug);
    if (existing) return existing;
    const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const tag = await db.tag.create({ data: { slug, label, kind: "SOURCE" } });
    tagIds.set(slug, tag.id);
    return tag.id;
  }

  console.log("Accounts...");
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const userIds = new Map<string, string>();
  for (const a of ACCOUNTS) {
    const u = await db.user.create({
      data: {
        email: `${a.handle}@torahscroll.test`,
        passwordHash,
        handle: a.handle,
        name: a.name,
        bio: a.bio,
        kind: a.kind,
        verified: a.verified,
        avatarHue: a.hue,
        onboarded: true,
        // The demo account moderates so the review queue is reachable.
        role: a.handle === "demo" ? "MODERATOR" : "MEMBER",
      },
    });
    userIds.set(a.handle, u.id);
  }

  console.log("Posts...");
  const all: SeedPost[] = [...EVERGREEN, ...calendarContent(cal)];
  const createdPosts: { id: string; haystack: string; author: string }[] = [];

  for (const p of all) {
    const authorId = userIds.get(p.author);
    if (!authorId) throw new Error(`Unknown seed author: ${p.author}`);
    const post = await db.post.create({
      data: {
        authorId,
        type: p.type,
        title: p.title ?? null,
        body: p.body ?? null,
        videoUrl: p.videoUrl ?? null,
        imageUrl: p.imageUrl ?? null,
        imageAlt: p.imageAlt ?? null,
        quizJson: p.quiz ? JSON.stringify(p.quiz) : null,
        sourceWork: p.sourceWork ?? null,
        sourceRef: p.sourceRef ?? null,
        heartCount: p.hearts,
        createdAt: at(p.ago),
      },
    });
    for (const slug of p.tags) {
      await db.postTag.create({ data: { postId: post.id, tagId: await ensureTag(slug) } });
    }
    createdPosts.push({
      id: post.id,
      haystack: [p.title, p.body, p.quiz?.question].filter(Boolean).join(" ~~ "),
      author: p.author,
    });
  }

  console.log("Comments...");
  for (const c of COMMENTS) {
    const target = createdPosts.find((p) => p.haystack.includes(c.postMatch));
    if (!target) {
      console.warn(`  ! no post matched "${c.postMatch}" - skipping comment`);
      continue;
    }
    const authorId = userIds.get(c.author);
    if (!authorId) continue;
    await db.comment.create({
      data: { postId: target.id, authorId, body: c.body, createdAt: at(c.ago) },
    });
    await db.post.update({ where: { id: target.id }, data: { commentCount: { increment: 1 } } });
  }

  console.log("Follow graph...");
  const handles = ACCOUNTS.map((a) => a.handle);
  const rand = rng(20260917);
  for (const follower of handles) {
    for (const target of handles) {
      if (follower === target) continue;
      const isOrg = ACCOUNTS.find((a) => a.handle === target)?.kind === "ORG";
      if (rand() < (isOrg ? 0.65 : 0.3)) {
        await db.follow.create({
          data: { followerId: userIds.get(follower)!, followingId: userIds.get(target)! },
        });
      }
    }
  }

  // Give the demo account a real starting point: it follows a few accounts and
  // carries enough affinity that the ranking signal is visible on first login.
  const demoId = userIds.get("demo")!;
  await db.follow.deleteMany({ where: { followerId: demoId } });
  for (const h of ["maggid", "shascompanion", "chavrusaquiz", "dstern", "seferdiagrams"]) {
    await db.follow.create({ data: { followerId: demoId, followingId: userIds.get(h)! } });
  }

  console.log("Hearts...");
  for (const post of createdPosts) {
    for (const h of handles) {
      if (h === post.author) continue;
      if (rand() < 0.22) {
        await db.heart
          .create({ data: { userId: userIds.get(h)!, postId: post.id } })
          .catch(() => undefined);
      }
    }
  }

  // One reported post so the review queue has something in it on a fresh seed.
  console.log("A reported post for the queue...");
  const reportable = await db.post.create({
    data: {
      authorId: userIds.get("dstern")!,
      type: "TEXT",
      title: "Selling my sefarim collection, DM me",
      body: "Full Shas, barely used, plus a complete Mishnah Berurah. Serious offers only. Also I do web design, rates on request.",
      createdAt: at(0.8),
    },
  });
  await db.postTag.create({ data: { postId: reportable.id, tagId: tagIds.get("daf-yomi")! } });
  for (const [handle, reason, note] of [
    ["mkatz", "SPAM", "This is an ad, not learning."],
    ["shirabloom", "SPAM", ""],
  ] as const) {
    await db.flag.create({
      data: { postId: reportable.id, userId: userIds.get(handle)!, reason, note },
    });
  }
  await db.post.update({ where: { id: reportable.id }, data: { flagCount: 2 } });

  console.log("Source catalogue...");
  for (const entry of SOURCE_CATALOG) {
    const account =
      (await db.user.findUnique({ where: { handle: entry.handle }, select: { id: true } })) ??
      (await db.user.create({
        data: {
          handle: entry.handle,
          name: entry.name,
          email: `${entry.handle}@torahscroll.local`,
          // Nobody signs in as a source account; it exists to own imported rows.
          passwordHash: "x",
          bio: entry.description,
          kind: "ORG",
          verified: true,
          avatarHue: entry.hue,
          onboarded: true,
        },
      }));

    await db.source.create({
      data: {
        slug: entry.slug,
        name: entry.name,
        description: entry.description,
        kind: entry.kind,
        feedRef: entry.feedRef ?? null,
        siteUrl: entry.siteUrl ?? null,
        accountId: account.id,
        enabled: entry.enabled,
        setupNote: entry.setupNote,
      },
    });

    // Tag the account so its imports inherit sensible tags.
    for (const slug of entry.tags) {
      const tagId = tagIds.get(slug);
      if (!tagId) continue;
      const seedPost = await db.post.findFirst({ where: { authorId: account.id }, select: { id: true } });
      if (seedPost) {
        await db.postTag.create({ data: { postId: seedPost.id, tagId } }).catch(() => undefined);
      }
    }
  }

  console.log("Demo affinities...");
  for (const [slug, score] of [
    ["daf-yomi", 3.2],
    ["machshava", 2.1],
    ["beginner-friendly", 1.4],
    ["mussar", 1.1],
  ] as const) {
    await db.tagAffinity.create({ data: { userId: demoId, tagId: tagIds.get(slug)!, score } });
  }

  console.log("\nDone:", {
    users: await db.user.count(),
    posts: await db.post.count(),
    comments: await db.comment.count(),
    hearts: await db.heart.count(),
    follows: await db.follow.count(),
    tags: await db.tag.count(),
    flags: await db.flag.count(),
    sources: await db.source.count(),
  });
  console.log("\nLog in as  demo@torahscroll.test  /  demo1234  (this account moderates)");
  console.log("Review queue at /moderate");
  console.log("\nRun  npm run sync:texts    for today's daf and mishnayos");
  console.log("Run  npm run sync:sources  to pull every enabled channel");
  console.log("Subscriptions page at /sources");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
