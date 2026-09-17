"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { bumpAffinity } from "@/lib/feed";
import { parseVideo } from "@/lib/format";
import { FLAG_REASONS } from "@/lib/taxonomy";
import { parseChannelId } from "@/lib/sources";

export type ActionResult = { error?: string; ok?: boolean };

/* ---------------------------------------------------------------- auth -- */

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Handle must be at least 3 characters")
    .max(24)
    .regex(/^[a-z0-9_]+$/, "Handle can use letters, numbers and underscores only"),
  email: z.string().trim().toLowerCase().email("That doesn't look like an email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signup(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, handle, email, password } = parsed.data;

  const clash = await db.user.findFirst({ where: { OR: [{ email }, { handle }] } });
  if (clash) {
    return { error: clash.email === email ? "That email is already registered" : "That handle is taken" };
  }

  const user = await db.user.create({
    data: {
      name,
      handle,
      email,
      passwordHash: await hashPassword(password),
      avatarHue: Math.floor(Math.random() * 360),
    },
  });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password" };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email or password is incorrect" };
  }
  await createSession(user.id);
  redirect(user.onboarded ? "/" : "/onboarding");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/** Completes onboarding by writing starting affinities for the chosen tags. */
export async function saveInterests(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const slugs = formData.getAll("tags").map(String);
  const tags = await db.tag.findMany({ where: { slug: { in: slugs } } });

  await db.$transaction([
    ...tags.map((t) =>
      db.tagAffinity.upsert({
        where: { userId_tagId: { userId: user.id, tagId: t.id } },
        create: { userId: user.id, tagId: t.id, score: 2.5 },
        update: { score: { increment: 2.5 } },
      })
    ),
    db.user.update({ where: { id: user.id }, data: { onboarded: true } }),
  ]);

  // Follow the orgs that post about what they picked, so the feed isn't bare.
  const orgs = await db.user.findMany({
    where: {
      kind: "ORG",
      posts: { some: { tags: { some: { tag: { slug: { in: slugs } } } } } },
    },
    select: { id: true },
    take: 6,
  });
  for (const org of orgs) {
    await db.follow
      .create({ data: { followerId: user.id, followingId: org.id } })
      .catch(() => undefined);
  }

  redirect("/");
}

/* --------------------------------------------------------------- posts -- */

const quizSchema = z.object({
  question: z.string().trim().min(5, "Write the question"),
  choices: z.array(z.string().trim().min(1)).min(2, "A quiz needs at least two choices"),
  answerIndex: z.number().int().min(0),
  explanation: z.string().trim().default(""),
});

export async function createPost(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in to post" };

  const type = String(formData.get("type") ?? "TEXT");
  if (!["TEXT", "QUIZ", "VIDEO", "IMAGE"].includes(type)) return { error: "Unknown post type" };

  const title = String(formData.get("title") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim() || null;
  const sourceWork = String(formData.get("sourceWork") ?? "").trim() || null;
  const sourceRef = String(formData.get("sourceRef") ?? "").trim() || null;
  const slugs = formData.getAll("tags").map(String).filter(Boolean);

  let videoUrl: string | null = null;
  let imageUrl: string | null = null;
  let imageAlt: string | null = null;
  let quizJson: string | null = null;

  if (type === "VIDEO") {
    videoUrl = String(formData.get("videoUrl") ?? "").trim();
    if (!videoUrl) return { error: "Paste a video link" };
    if (!parseVideo(videoUrl)) {
      return { error: "That link isn't a YouTube or Vimeo video we can embed" };
    }
  }

  if (type === "IMAGE") {
    imageUrl = String(formData.get("imageUrl") ?? "").trim();
    imageAlt = String(formData.get("imageAlt") ?? "").trim() || null;
    if (!imageUrl) return { error: "Add an image URL or pick one of the sample diagrams" };
  }

  if (type === "QUIZ") {
    const choices = [0, 1, 2, 3]
      .map((i) => String(formData.get(`choice${i}`) ?? "").trim())
      .filter(Boolean);
    const parsed = quizSchema.safeParse({
      question: String(formData.get("question") ?? ""),
      choices,
      answerIndex: Number(formData.get("answerIndex") ?? 0),
      explanation: String(formData.get("explanation") ?? ""),
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    if (parsed.data.answerIndex >= parsed.data.choices.length) {
      return { error: "Mark which choice is the correct answer" };
    }
    quizJson = JSON.stringify(parsed.data);
  }

  if (type === "TEXT" && !body) return { error: "Write something first" };

  const tags = slugs.length
    ? await db.tag.findMany({ where: { slug: { in: slugs } }, select: { id: true } })
    : [];

  const post = await db.post.create({
    data: {
      authorId: user.id,
      type,
      title,
      body,
      videoUrl,
      imageUrl,
      imageAlt,
      quizJson,
      sourceWork,
      sourceRef,
      tags: { create: tags.map((t) => ({ tagId: t.id })) },
    },
  });

  revalidatePath("/");
  redirect(`/post/${post.id}`);
}

export async function toggleHeart(postId: string, pathToRevalidate: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existing = await db.heart.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  if (existing) {
    await db.$transaction([
      db.heart.delete({ where: { userId_postId: { userId: user.id, postId } } }),
      db.post.update({ where: { id: postId }, data: { heartCount: { decrement: 1 } } }),
    ]);
    await bumpAffinity(user.id, postId, -0.5);
  } else {
    await db.$transaction([
      db.heart.create({ data: { userId: user.id, postId } }),
      db.post.update({ where: { id: postId }, data: { heartCount: { increment: 1 } } }),
    ]);
    await bumpAffinity(user.id, postId, 0.5);
  }
  revalidatePath(pathToRevalidate);
}

export async function addComment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!postId || !body) return;

  await db.$transaction([
    db.comment.create({ data: { postId, authorId: user.id, body: body.slice(0, 2000) } }),
    db.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
  ]);
  // Commenting is a stronger signal of interest than a heart.
  await bumpAffinity(user.id, postId, 0.9);
  revalidatePath(`/post/${postId}`);
}

export async function answerQuiz(postId: string, choice: number, pathToRevalidate: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const post = await db.post.findUnique({ where: { id: postId }, select: { quizJson: true } });
  if (!post?.quizJson) return;
  const quiz = JSON.parse(post.quizJson) as { answerIndex: number };
  const correct = choice === quiz.answerIndex;

  await db.quizResponse.upsert({
    where: { userId_postId: { userId: user.id, postId } },
    create: { userId: user.id, postId, choice, correct },
    update: { choice, correct },
  });
  await bumpAffinity(user.id, postId, 0.7);
  revalidatePath(pathToRevalidate);
}

/* ---------------------------------------------------------- moderation -- */

/**
 * Flagging hides nothing on its own. It puts the post in a queue for a
 * moderator, which is deliberate: a report is not a verdict, and letting any
 * reader take a post down would be its own kind of abuse.
 */
export async function flagPost(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to report a post" };

  const postId = String(formData.get("postId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!postId) return { error: "Missing post" };
  if (!FLAG_REASONS.some((r) => r.value === reason)) return { error: "Pick a reason" };

  const post = await db.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return { error: "That post no longer exists" };

  const existing = await db.flag.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });
  if (existing) return { ok: true };

  await db.$transaction([
    db.flag.create({ data: { postId, userId: user.id, reason, note } }),
    db.post.update({ where: { id: postId }, data: { flagCount: { increment: 1 } } }),
  ]);

  revalidatePath(`/post/${postId}`);
  return { ok: true };
}

async function requireModerator() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const full = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (full?.role !== "MODERATOR") redirect("/");
  return user;
}

export async function resolveFlags(formData: FormData) {
  const mod = await requireModerator();

  const postId = String(formData.get("postId") ?? "");
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!postId || !["REMOVE", "KEEP"].includes(action)) return;

  await db.$transaction([
    db.flag.updateMany({ where: { postId }, data: { resolved: true } }),
    db.post.update({
      where: { id: postId },
      data:
        action === "REMOVE"
          ? { status: "REMOVED", removedAt: new Date(), removedWhy: note || "Removed after review" }
          : { status: "LIVE", removedAt: null, removedWhy: null },
    }),
    db.moderationAction.create({
      data: { postId, moderatorId: mod.id, action, note },
    }),
  ]);

  revalidatePath("/moderate");
  revalidatePath("/");
}

/* ------------------------------------------------------------- sources -- */

/** Point a source at its feed and switch it on. Moderators only. */
export async function configureSource(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireModerator();

  const id = String(formData.get("sourceId") ?? "");
  const feedInput = String(formData.get("feedRef") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  const source = await db.source.findUnique({ where: { id } });
  if (!source) return { error: "No such source" };

  let feedRef = source.feedRef;
  if (feedInput) {
    if (source.kind === "YOUTUBE") {
      const parsed = parseChannelId(feedInput);
      if ("error" in parsed) return { error: parsed.error };
      feedRef = parsed.channelId;
    } else if (source.kind === "RSS") {
      try {
        const u = new URL(feedInput);
        if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
        feedRef = u.toString();
      } catch {
        return { error: "That is not a valid feed URL" };
      }
    }
  }

  if (enabled && source.kind !== "BUILTIN_TEXT" && !feedRef) {
    return { error: "Add a channel id or feed URL before enabling this source" };
  }

  await db.source.update({
    where: { id },
    data: { feedRef, enabled, setupNote: enabled ? "" : source.setupNote },
  });
  revalidatePath("/sources");
  return { ok: true };
}

export async function toggleFollow(targetId: string, pathToRevalidate: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.id === targetId) return;

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
  });
  if (existing) {
    await db.follow.delete({
      where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
    });
  } else {
    await db.follow.create({ data: { followerId: user.id, followingId: targetId } });
  }
  revalidatePath(pathToRevalidate);
}
