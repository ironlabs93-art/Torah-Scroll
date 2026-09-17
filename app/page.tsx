import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { buildFeed, recordImpressions, type FeedMode } from "@/lib/feed";
import { refreshDailyTextsInBackground } from "@/lib/daily-import";
import { db } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { TopBar, CalendarPanel, CalendarStrip, SidebarSection } from "@/components/shell";
import { Avatar, EmptyState } from "@/components/ui";
import { FollowButton } from "@/components/interactions";

export const dynamic = "force-dynamic";

const TABS: { mode: FeedMode; label: string; short: string; blurb: string }[] = [
  { mode: "foryou", label: "For You", short: "For You", blurb: "Ranked by what you learn and what today is" },
  { mode: "today", label: "Today's Learning", short: "Today", blurb: "Only what lines up with the calendar" },
  { mode: "following", label: "Following", short: "Following", blurb: "Newest first, from accounts you follow" },
];

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/welcome");
  if (!user.onboarded) redirect("/onboarding");

  // Fire and forget: the reader gets their feed whether or not Sefaria answers.
  void refreshDailyTextsInBackground();

  const params = await searchParams;
  const mode = (TABS.find((t) => t.mode === params.tab)?.mode ?? "foryou") as FeedMode;

  const { posts, calendar } = await buildFeed({ userId: user.id, mode, limit: 30 });

  // Remember what was shown so the next load moves forward instead of looping.
  if (posts.length) {
    await recordImpressions(
      user.id,
      posts.slice(0, 12).map((p) => p.id)
    );
  }

  const suggestions = await db.user.findMany({
    where: {
      id: { not: user.id },
      followers: { none: { followerId: user.id } },
    },
    orderBy: { posts: { _count: "desc" } },
    take: 4,
    select: { id: true, name: true, handle: true, bio: true, avatarHue: true, verified: true, kind: true },
  });

  const activeTab = TABS.find((t) => t.mode === mode)!;

  return (
    <>
      <TopBar user={user} isModerator={user?.role === "MODERATOR"} />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <CalendarStrip cal={calendar} />
          <nav className="mb-1 flex gap-1 rounded-full border border-parchment-edge bg-[#fffdf8] p-1">
            {TABS.map((t) => (
              <Link
                key={t.mode}
                href={t.mode === "foryou" ? "/" : `/?tab=${t.mode}`}
                className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 text-center text-sm font-medium transition ${
                  t.mode === mode
                    ? "bg-accent text-white"
                    : "text-ink-soft hover:bg-parchment-deep"
                }`}
              >
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </Link>
            ))}
          </nav>
          <p className="mb-4 px-2 text-xs text-ink-faint">{activeTab.blurb}</p>

          <div className="scroll-snap space-y-4">
            {posts.length === 0 ? (
              <EmptyState
                title={mode === "following" ? "Your Following feed is empty" : "Nothing here yet"}
                body={
                  mode === "following"
                    ? "Follow a few accounts and their posts will land here, newest first."
                    : "Try the For You tab, or post something yourself."
                }
              />
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} path="/" />)
            )}
          </div>

          {posts.length > 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-ink-faint">
                That&apos;s the feed for now.
              </p>
              <p className="mt-1 text-sm text-ink-faint">
                It refills as people post and as the calendar moves.{" "}
                <Link href="/compose" className="text-accent hover:underline">
                  Add something
                </Link>
                .
              </p>
            </div>
          )}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <CalendarPanel cal={calendar} />

          {suggestions.length > 0 && (
            <SidebarSection title="Worth following">
              <ul className="space-y-4">
                {suggestions.map((s) => (
                  <li key={s.id} className="flex items-start gap-3">
                    <Link href={`/u/${s.handle}`}>
                      <Avatar name={s.name} hue={s.avatarHue} size={38} verified={s.verified} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/u/${s.handle}`}
                        className="block truncate text-sm font-semibold text-ink hover:underline"
                      >
                        {s.name}
                      </Link>
                      <p className="line-clamp-2 text-xs leading-snug text-ink-faint">{s.bio}</p>
                    </div>
                    <FollowButton targetId={s.id} following={false} path="/" size="sm" />
                  </li>
                ))}
              </ul>
            </SidebarSection>
          )}

          <SidebarSection title="Why this post?">
            <p className="text-sm leading-relaxed text-ink-soft">
              Every card says what put it in front of you: today&apos;s daf, this week&apos;s
              parsha, an account you follow, or a topic you keep coming back to.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-faint">
              There&apos;s no hidden score here. If a reason looks wrong, the ranking is wrong.
            </p>
          </SidebarSection>
        </aside>
      </div>
    </>
  );
}
