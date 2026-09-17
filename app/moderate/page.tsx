import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { resolveFlags } from "@/app/actions";
import { TopBar } from "@/components/shell";
import { Avatar, Card, EmptyState } from "@/components/ui";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  INAPPROPRIATE: "Inappropriate",
  INACCURATE: "Wrong source",
  SPAM: "Spam",
  OTHER: "Other",
};

export default async function ModeratePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const me = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (me?.role !== "MODERATOR") redirect("/");

  const flagged = await db.post.findMany({
    where: { flags: { some: { resolved: false } } },
    orderBy: [{ flagCount: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true, handle: true, avatarHue: true, verified: true } },
      flags: {
        where: { resolved: false },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { handle: true } } },
      },
    },
  });

  const removed = await db.post.findMany({
    where: { status: "REMOVED" },
    orderBy: { removedAt: "desc" },
    take: 10,
    include: { author: { select: { name: true, handle: true } } },
  });

  return (
    <>
      <TopBar user={user} isModerator={user?.role === "MODERATOR"} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Review queue</h1>
        <p className="mb-6 mt-2 text-[16px] leading-relaxed text-ink-soft">
          Posts readers have reported. Removing takes a post out of every feed but keeps the
          row, so there is a record of what was taken down and why.
        </p>

        {flagged.length === 0 ? (
          <EmptyState title="Nothing waiting" body="No unresolved reports. This is the good outcome." />
        ) : (
          <div className="space-y-4">
            {flagged.map((post) => (
              <Card key={post.id} className="p-5">
                <div className="mb-3 flex items-start gap-3">
                  <Avatar name={post.author.name} hue={post.author.avatarHue} size={38} verified={post.author.verified} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/u/${post.author.handle}`} className="font-semibold text-ink hover:underline">
                      {post.author.name}
                    </Link>
                    <p className="text-sm text-ink-faint">
                      @{post.author.handle} · {timeAgo(post.createdAt)} ·{" "}
                      <Link href={`/post/${post.id}`} className="text-accent hover:underline">
                        open post
                      </Link>
                    </p>
                  </div>
                  <span className="rounded-full bg-[#faeeee] px-3 py-1 text-xs font-semibold text-[#8d3b3b]">
                    {post.flags.length} report{post.flags.length === 1 ? "" : "s"}
                  </span>
                </div>

                {post.title && <h2 className="mb-1 text-lg font-semibold text-ink">{post.title}</h2>}
                {post.body && (
                  <p className="line-clamp-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                    {post.body}
                  </p>
                )}
                {post.status === "REMOVED" && (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#8d3b3b]">
                    Currently removed
                  </p>
                )}

                <ul className="mt-4 space-y-2 border-t border-parchment-edge pt-3">
                  {post.flags.map((f) => (
                    <li key={f.id} className="text-sm">
                      <span className="rounded bg-parchment-deep px-2 py-0.5 text-xs font-medium text-ink-soft">
                        {REASON_LABEL[f.reason] ?? f.reason}
                      </span>{" "}
                      <span className="text-ink-faint">@{f.user.handle}</span>
                      {f.note && <span className="text-ink-soft"> — “{f.note}”</span>}
                    </li>
                  ))}
                </ul>

                <form action={resolveFlags} className="mt-4 flex flex-wrap items-center gap-2 border-t border-parchment-edge pt-4">
                  <input type="hidden" name="postId" value={post.id} />
                  <input
                    name="note"
                    placeholder="Note for the record (optional)"
                    className="min-w-0 flex-1 rounded-lg border border-parchment-edge bg-parchment/40 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    name="action"
                    value="KEEP"
                    className="rounded-full border border-parchment-edge px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-accent hover:text-accent-deep"
                  >
                    Keep it up
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="REMOVE"
                    className="rounded-full bg-[#a33] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8d2c2c]"
                  >
                    Remove
                  </button>
                </form>
              </Card>
            ))}
          </div>
        )}

        {removed.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Recently removed
            </h2>
            <Card className="divide-y divide-parchment-edge">
              {removed.map((p) => (
                <div key={p.id} className="px-5 py-3 text-sm">
                  <span className="text-ink">{p.title ?? (p.body ?? "").slice(0, 70)}</span>
                  <span className="text-ink-faint"> · @{p.author.handle}</span>
                  {p.removedWhy && <p className="mt-0.5 text-xs text-ink-faint">{p.removedWhy}</p>}
                </div>
              ))}
            </Card>
          </section>
        )}
      </main>
    </>
  );
}
