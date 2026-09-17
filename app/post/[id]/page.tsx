import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDailyLearning } from "@/lib/calendar";
import { timeAgo } from "@/lib/format";
import { TopBar, CalendarPanel, SidebarSection } from "@/components/shell";
import { PostCard } from "@/components/post-card";
import { Avatar, Card } from "@/components/ui";
import { CommentBox } from "@/components/interactions";
import { FlagButton } from "@/components/flag";
import type { FeedPost } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, handle: true, kind: true, verified: true, avatarHue: true },
      },
      tags: { include: { tag: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { name: true, handle: true, avatarHue: true, verified: true } },
        },
      },
    },
  });
  if (!post || post.status === "REMOVED") notFound();

  const [hearted, answered] = user
    ? await Promise.all([
        db.heart.findUnique({ where: { userId_postId: { userId: user.id, postId: id } } }),
        db.quizResponse.findUnique({
          where: { userId_postId: { userId: user.id, postId: id } },
          select: { choice: true, correct: true },
        }),
      ])
    : [null, null];

  const feedPost = {
    ...post,
    score: 0,
    reasons: [],
    hearted: Boolean(hearted),
    answered: answered ?? null,
  } as unknown as FeedPost;

  const cal = getDailyLearning();
  const path = `/post/${id}`;

  return (
    <>
      <TopBar user={user} isModerator={user?.role === "MODERATOR"} />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-faint transition hover:text-accent"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to the feed
          </Link>

          <PostCard post={feedPost} path={path} showReasons={false} />

          {user && user.id !== post.authorId && (
            <div className="mt-3 flex justify-end">
              <FlagButton postId={post.id} />
            </div>
          )}

          <section className="mt-6">
            <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {post.comments.length === 0
                ? "No comments yet"
                : `${post.comments.length} comment${post.comments.length === 1 ? "" : "s"}`}
            </h2>

            {user ? (
              <Card className="mb-4 p-4">
                <CommentBox postId={post.id} />
              </Card>
            ) : (
              <Card className="mb-4 p-4 text-sm text-ink-faint">
                <Link href="/login" className="text-accent hover:underline">
                  Sign in
                </Link>{" "}
                to join the conversation.
              </Card>
            )}

            <div className="space-y-3">
              {post.comments.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Link href={`/u/${c.author.handle}`}>
                      <Avatar
                        name={c.author.name}
                        hue={c.author.avatarHue}
                        size={36}
                        verified={c.author.verified}
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <Link
                          href={`/u/${c.author.handle}`}
                          className="text-sm font-semibold text-ink hover:underline"
                        >
                          {c.author.name}
                        </Link>
                        <span className="text-xs text-ink-faint">
                          @{c.author.handle} · {timeAgo(c.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-line text-[16px] leading-relaxed text-ink-soft">
                        {c.body}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <CalendarPanel cal={cal} />
          <SidebarSection title="About this post">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Posted</dt>
                <dd className="text-ink">{post.createdAt.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Format</dt>
                <dd className="text-ink">
                  {post.type === "TEXT" ? "Dvar Torah" : post.type.toLowerCase()}
                </dd>
              </div>
              {post.sourceWork && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Source</dt>
                  <dd className="text-ink">
                    {post.sourceWork} {post.sourceRef}
                  </dd>
                </div>
              )}
            </dl>
          </SidebarSection>
        </aside>
      </div>
    </>
  );
}
