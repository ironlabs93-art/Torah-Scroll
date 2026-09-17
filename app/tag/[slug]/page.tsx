import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDailyLearning } from "@/lib/calendar";
import { TopBar, CalendarPanel, SidebarSection } from "@/components/shell";
import { PostCard } from "@/components/post-card";
import { Card, EmptyState, TagChip } from "@/components/ui";
import type { FeedPost } from "@/lib/feed";

export const dynamic = "force-dynamic";

const KIND_BLURB: Record<string, string> = {
  TRACK: "A daily learning cycle. Posts here are pinned to whatever today's portion is.",
  HOLIDAY: "Everything tagged to this time of year. It climbs the feed as the date approaches.",
  TOPIC: "A subject people keep coming back to.",
  SOURCE: "Posts tagged to this sedra or source.",
};

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getCurrentUser();

  const tag = await db.tag.findUnique({ where: { slug } });
  if (!tag) notFound();

  const posts = await db.post.findMany({
    where: { status: "LIVE", tags: { some: { tagId: tag.id } } },
    orderBy: [{ heartCount: "desc" }, { createdAt: "desc" }],
    take: 30,
    include: {
      author: {
        select: { id: true, name: true, handle: true, kind: true, verified: true, avatarHue: true },
      },
      tags: { include: { tag: true } },
    },
  });

  const [hearts, answers] = viewer
    ? await Promise.all([
        db.heart.findMany({ where: { userId: viewer.id }, select: { postId: true } }),
        db.quizResponse.findMany({
          where: { userId: viewer.id },
          select: { postId: true, choice: true, correct: true },
        }),
      ])
    : [[], []];

  const heartSet = new Set(hearts.map((h) => h.postId));
  const answerMap = new Map(answers.map((a) => [a.postId, { choice: a.choice, correct: a.correct }]));

  const related = await db.tag.findMany({
    where: { kind: tag.kind, slug: { not: slug } },
    take: 8,
  });

  const cal = getDailyLearning();
  const path = `/tag/${slug}`;

  return (
    <>
      <TopBar user={viewer} isModerator={viewer?.role === "MODERATOR"} />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <Card className="mb-5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {tag.kind.toLowerCase()}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-ink">{tag.label}</h1>
              {tag.hebrew && <span className="hebrew text-2xl text-accent">{tag.hebrew}</span>}
            </div>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
              {KIND_BLURB[tag.kind] ?? KIND_BLURB.TOPIC}
            </p>
            {slug === "daf-yomi" && (
              <p className="mt-3 rounded-lg bg-accent-soft px-4 py-2.5 text-sm text-accent-deep">
                Today: <strong>{cal.dafYomi.display}</strong>
              </p>
            )}
            {slug === "mishnah-yomi" && cal.mishnaYomi && (
              <p className="mt-3 rounded-lg bg-accent-soft px-4 py-2.5 text-sm text-accent-deep">
                Today: <strong>{cal.mishnaYomi.display}</strong>
              </p>
            )}
          </Card>

          <div className="space-y-4">
            {posts.length === 0 ? (
              <EmptyState
                title={`Nothing tagged ${tag.label} yet`}
                body="Be the first. Post something and tag it."
              />
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={
                    {
                      ...post,
                      score: 0,
                      reasons: [],
                      hearted: heartSet.has(post.id),
                      answered: answerMap.get(post.id) ?? null,
                    } as unknown as FeedPost
                  }
                  path={path}
                  showReasons={false}
                />
              ))
            )}
          </div>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <CalendarPanel cal={cal} />
          {related.length > 0 && (
            <SidebarSection title="Related tags">
              <div className="flex flex-wrap gap-2">
                {related.map((t) => (
                  <TagChip key={t.id} slug={t.slug} label={t.label} />
                ))}
              </div>
            </SidebarSection>
          )}
          <div className="px-2 text-sm text-ink-faint">
            <Link href="/" className="text-accent hover:underline">
              Back to the feed
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
