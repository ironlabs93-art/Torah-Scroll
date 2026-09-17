import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TopBar } from "@/components/shell";
import { Avatar, Card, EmptyState } from "@/components/ui";
import { FollowButton } from "@/components/interactions";
import { SourceSetup } from "./setup";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  YOUTUBE: "YouTube channel",
  RSS: "Feed",
  BUILTIN_TEXT: "Built in",
};

export default async function SourcesPage() {
  const user = await getCurrentUser();
  const isModerator = user?.role === "MODERATOR";

  const sources = await db.source.findMany({
    orderBy: [{ enabled: "desc" }, { name: "asc" }],
    include: {
      account: {
        select: {
          id: true,
          name: true,
          handle: true,
          avatarHue: true,
          verified: true,
          _count: { select: { followers: true, posts: true } },
        },
      },
    },
  });

  const following = user
    ? new Set(
        (
          await db.follow.findMany({
            where: { followerId: user.id },
            select: { followingId: true },
          })
        ).map((f) => f.followingId)
      )
    : new Set<string>();

  const live = sources.filter((s) => s.enabled);
  const pending = sources.filter((s) => !s.enabled);

  return (
    <>
      <TopBar user={user} isModerator={isModerator} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Subscriptions</h1>
        <p className="mb-8 mt-2 text-[16px] leading-relaxed text-ink-soft">
          Channels you can follow. Their posts join your feed and rank alongside everything
          else, so a shiur on today&apos;s daf still lands near the top.
        </p>

        <section className="space-y-4">
          {live.length === 0 ? (
            <EmptyState
              title="No channels are live yet"
              body="The built-in daily texts turn on once the database is seeded."
            />
          ) : (
            live.map((s) => (
              <Card key={s.id} className="p-5">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                  <Link href={`/u/${s.account.handle}`}>
                    <Avatar
                      name={s.account.name}
                      hue={s.account.avatarHue}
                      size={48}
                      verified={s.account.verified}
                    />
                  </Link>
                  <div className="min-w-0 flex-1 basis-[55%]">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/u/${s.account.handle}`} className="text-lg font-semibold text-ink hover:underline">
                        {s.name}
                      </Link>
                      <span className="rounded bg-parchment-deep px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                        {KIND_LABEL[s.kind] ?? s.kind}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{s.description}</p>
                    <p className="mt-2 text-xs text-ink-faint">
                      {s.account._count.posts} posts · {s.account._count.followers} subscribers
                      {s.siteUrl && (
                        <>
                          {" · "}
                          <a
                            href={s.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-dotted underline-offset-2 hover:text-accent"
                          >
                            website
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  {user && (
                    <div className="w-full sm:w-auto">
                      <FollowButton
                        targetId={s.account.id}
                        following={following.has(s.account.id)}
                        path="/sources"
                      />
                    </div>
                  )}
                </div>
                {isModerator && <SourceSetup source={{ id: s.id, kind: s.kind, feedRef: s.feedRef, enabled: s.enabled }} />}
              </Card>
            ))
          )}
        </section>

        {pending.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Not switched on yet
            </h2>
            <p className="mb-4 mt-2 text-sm leading-relaxed text-ink-soft">
              These are other people&apos;s publications. Each one needs a feed address, and it
              needs the publisher&apos;s agreement. Embedding a public video is ordinary use, but
              turning up to an organization with their catalogue already syndicated is a poor
              way to introduce yourself, and these are the partners this app wants.
            </p>
            <div className="space-y-3">
              {pending.map((s) => (
                <Card key={s.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={s.account.name} hue={s.account.avatarHue} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink">{s.name}</span>
                        <span className="rounded bg-parchment-deep px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                          {KIND_LABEL[s.kind] ?? s.kind}
                        </span>
                      </div>
                      <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{s.description}</p>
                      {s.setupNote && (
                        <p className="mt-2 rounded-lg border-l-[3px] border-gold bg-gold-soft/60 px-3 py-2 text-[13px] leading-relaxed text-[#7d5a1d]">
                          {s.setupNote}
                        </p>
                      )}
                    </div>
                  </div>
                  {isModerator && <SourceSetup source={{ id: s.id, kind: s.kind, feedRef: s.feedRef, enabled: s.enabled }} />}
                </Card>
              ))}
            </div>
          </section>
        )}

        {!isModerator && (
          <p className="mt-10 text-sm text-ink-faint">
            Adding a channel is a moderator action.
          </p>
        )}
      </main>
    </>
  );
}
