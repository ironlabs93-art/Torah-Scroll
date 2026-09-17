import Link from "next/link";
import { Avatar, Card, ReasonPill, TagChip } from "./ui";
import { HeartButton, QuizCard, VideoEmbed } from "./interactions";
import { timeAgo, parseVideo, embedUrl, sefariaUrl } from "@/lib/format";
import type { FeedPost } from "@/lib/feed";

function SourceLine({ work, sourceRef }: { work: string; sourceRef: string | null }) {
  const url = sefariaUrl(work, sourceRef);
  const label = sourceRef ? `${work} ${sourceRef}` : work;
  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md bg-parchment-deep px-2 py-1 text-xs font-medium text-ink-soft transition hover:bg-accent-soft hover:text-accent-deep"
      title="Open on Sefaria"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path d="M4 3h5.5a2.5 2.5 0 012.5 2.5V17a2 2 0 00-2-2H4V3zm12 0h-2.2A3.7 3.7 0 0113 5.5V15h3V3z" />
      </svg>
      {label}
    </a>
  );
}

export function PostCard({
  post,
  path,
  showReasons = true,
}: {
  post: FeedPost;
  path: string;
  showReasons?: boolean;
}) {
  const quiz = post.quizJson ? JSON.parse(post.quizJson) : null;
  const video = post.videoUrl ? parseVideo(post.videoUrl) : null;

  return (
    <Card className="animate-rise overflow-hidden">
      {showReasons && post.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-parchment-edge/70 bg-parchment/40 px-5 py-2.5">
          {post.reasons.map((r, i) => (
            <ReasonPill key={i} kind={r.kind} label={r.label} />
          ))}
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-start gap-3">
          <Link href={`/u/${post.author.handle}`}>
            <Avatar
              name={post.author.name}
              hue={post.author.avatarHue}
              verified={post.author.verified}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Link
                href={`/u/${post.author.handle}`}
                className="font-semibold text-ink hover:underline"
              >
                {post.author.name}
              </Link>
              {post.author.kind === "ORG" && (
                <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-deep">
                  Org
                </span>
              )}
              <span className="text-sm text-ink-faint">
                @{post.author.handle} · {timeAgo(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {post.title && (
          <Link href={`/post/${post.id}`}>
            <h2 className="mb-2 text-[19px] font-semibold leading-snug text-ink hover:underline sm:text-[21px]">
              {post.title}
            </h2>
          </Link>
        )}

        {post.type === "QUIZ" && quiz && (
          <QuizCard postId={post.id} quiz={quiz} answered={post.answered} path={path} />
        )}

        {post.body && (
          <div className="whitespace-pre-line text-[15.5px] leading-[1.6] text-ink-soft sm:text-[17px] sm:leading-[1.65]">
            {post.body}
          </div>
        )}

        {post.type === "VIDEO" && video && (
          <div className="mt-3">
            <VideoEmbed embed={embedUrl(video)} title={post.title ?? "Shiur"} />
          </div>
        )}

        {post.type === "IMAGE" && post.imageUrl && (
          <Link href={`/post/${post.id}`} className="mt-3 block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={post.imageAlt ?? post.title ?? "Diagram"}
              className="w-full rounded-xl border border-parchment-edge bg-parchment"
              loading="lazy"
            />
          </Link>
        )}

        {post.origin === "IMPORT" && (
          <p className="mt-3 border-t border-parchment-edge/70 pt-2.5 text-xs text-ink-faint">
            Text from{" "}
            <a
              href={post.sourceUrl ?? "https://www.sefaria.org"}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-2 hover:text-accent"
            >
              Sefaria
            </a>
            {post.sourceName ? ` · ${post.sourceName}` : ""}
          </p>
        )}

        {(post.sourceWork || post.tags.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {post.sourceWork && <SourceLine work={post.sourceWork} sourceRef={post.sourceRef} />}
            {post.tags.map((t) => (
              <TagChip key={t.tag.id} slug={t.tag.slug} label={t.tag.label} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-parchment-edge/70 px-3 py-1.5">
        <HeartButton
          postId={post.id}
          count={post.heartCount}
          hearted={post.hearted}
          path={path}
        />
        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-ink-faint transition hover:text-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]">
            <path d="M21 12a8 8 0 01-8 8H8l-5 3 1.4-4.2A8 8 0 1121 12z" />
          </svg>
          <span className="tabular-nums">{post.commentCount}</span>
        </Link>
        <span className="ml-auto pr-2 text-[11px] uppercase tracking-wider text-ink-faint/70">
          {post.type === "TEXT" ? "Dvar Torah" : post.type.toLowerCase()}
        </span>
      </div>
    </Card>
  );
}
