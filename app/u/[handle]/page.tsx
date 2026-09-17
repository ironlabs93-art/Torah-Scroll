import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDailyLearning } from "@/lib/calendar";
import { TopBar, CalendarPanel } from "@/components/shell";
import { PostCard } from "@/components/post-card";
import { Avatar, Card, EmptyState } from "@/components/ui";
import { FollowButton } from "@/components/interactions";
import type { FeedPost } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const viewer = await getCurrentUser();

  const profile = await db.user.findUnique({
    where: { handle: handle.toLowerCase() },
    include: {
      _count: { select: { posts: true, followers: true, following: true } },
      posts: {
        where: { status: "LIVE" },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          author: {
            select: { id: true, name: true, handle: true, kind: true, verified: true, avatarHue: true },
          },
          tags: { include: { tag: true } },
        },
      },
    },
  });
  if (!profile) notFound();

  const [isFollowing, hearts, answers] = viewer
    ? await Promise.all([
        db.follow.findUnique({
          where: { followerId_followingId: { followerId: viewer.id, followingId: profile.id } },
        }),
        db.heart.findMany({ where: { userId: viewer.id }, select: { postId: true } }),
        db.quizResponse.findMany({
          where: { userId: viewer.id },
          select: { postId: true, choice: true, correct: true },
        }),
      ])
    : [null, [], []];

  const heartSet = new Set(hearts.map((h) => h.postId));
  const answerMap = new Map(answers.map((a) => [a.postId, { choice: a.choice, correct: a.correct }]));
  const path = `/u/${handle}`;
  const cal = getDailyLearning();

  return (
    <>
      <TopBar user={viewer} isModerator={viewer?.role === "MODERATOR"} />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <Card className="mb-5 p-6">
            <div className="flex items-start gap-4">
              <Avatar
                name={profile.name}
                hue={profile.avatarHue}
                size={72}
                verified={profile.verified}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-ink">{profile.name}</h1>
                  {profile.kind === "ORG" && (
                    <span className="rounded bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-deep">
                      Organization
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-faint">@{profile.handle}</p>
                {profile.bio && (
                  <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{profile.bio}</p>
                )}
                <div className="mt-4 flex gap-5 text-sm">
                  <span>
                    <strong className="text-ink">{profile._count.posts}</strong>{" "}
                    <span className="text-ink-faint">posts</span>
                  </span>
                  <span>
                    <strong className="text-ink">{profile._count.followers}</strong>{" "}
                    <span className="text-ink-faint">followers</span>
                  </span>
                  <span>
                    <strong className="text-ink">{profile._count.following}</strong>{" "}
                    <span className="text-ink-faint">following</span>
                  </span>
                </div>
              </div>
              {viewer && viewer.id !== profile.id && (
                <FollowButton
                  targetId={profile.id}
                  following={Boolean(isFollowing)}
                  path={path}
                />
              )}
            </div>
          </Card>

          <div className="space-y-4">
            {profile.posts.length === 0 ? (
              <EmptyState
                title="Nothing posted yet"
                body={
                  viewer?.id === profile.id
                    ? "Your posts will show up here once you write one."
                    : `${profile.name} hasn't posted yet.`
                }
              />
            ) : (
              profile.posts.map((post) => (
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
        </aside>
      </div>
    </>
  );
}
