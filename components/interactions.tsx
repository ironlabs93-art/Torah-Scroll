"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleHeart, answerQuiz, toggleFollow } from "@/app/actions";

export function HeartButton({
  postId,
  count,
  hearted,
  path,
}: {
  postId: string;
  count: number;
  hearted: boolean;
  path: string;
}) {
  const [optimistic, setOptimistic] = useState({ hearted, count });
  const [pending, start] = useTransition();

  function onClick() {
    setOptimistic((s) => ({ hearted: !s.hearted, count: s.count + (s.hearted ? -1 : 1) }));
    start(() => {
      void toggleHeart(postId, path);
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      data-heart-button={postId}
      aria-pressed={optimistic.hearted}
      aria-label={optimistic.hearted ? "Remove heart" : "Heart this"}
      className={`group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition ${
        optimistic.hearted ? "text-[#b23a48]" : "text-ink-faint hover:text-[#b23a48]"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-[18px] w-[18px] ${optimistic.hearted ? "animate-pop" : ""}`}
        fill={optimistic.hearted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 20.5s-7.5-4.7-7.5-9.8a4.2 4.2 0 017.5-2.6 4.2 4.2 0 017.5 2.6c0 5.1-7.5 9.8-7.5 9.8z" />
      </svg>
      <span className="tabular-nums">{optimistic.count}</span>
    </button>
  );
}

export function FollowButton({
  targetId,
  following,
  path,
  size = "md",
}: {
  targetId: string;
  following: boolean;
  path: string;
  size?: "sm" | "md";
}) {
  const [isFollowing, setIsFollowing] = useState(following);
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() => {
        setIsFollowing((v) => !v);
        start(() => {
          void toggleFollow(targetId, path);
        });
      }}
      disabled={pending}
      className={`rounded-full border font-medium transition ${
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
      } ${
        isFollowing
          ? "border-parchment-edge bg-parchment-deep text-ink-soft hover:border-[#c98b8b] hover:text-[#a33]"
          : "border-accent bg-accent text-white hover:bg-accent-deep"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}

type Quiz = { question: string; choices: string[]; answerIndex: number; explanation: string };

export function QuizCard({
  postId,
  quiz,
  answered,
  path,
}: {
  postId: string;
  quiz: Quiz;
  answered: { choice: number; correct: boolean } | null;
  path: string;
}) {
  const [picked, setPicked] = useState<number | null>(answered?.choice ?? null);
  const [, start] = useTransition();
  const revealed = picked !== null;

  function choose(i: number) {
    if (revealed) return;
    setPicked(i);
    start(() => {
      void answerQuiz(postId, i, path);
    });
  }

  return (
    <div className="rounded-xl border border-parchment-edge bg-parchment/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gold">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.9 12H9.1v-1.8h1.8V14zm1.2-5.1c-.3.4-.8.8-1.3 1.2-.3.2-.4.5-.4.9v.3H9.1v-.5c0-.7.2-1.2.9-1.7.5-.4.9-.7 1-1 .2-.5-.1-1.1-1-1.1-.6 0-1.1.4-1.2 1H7c.1-1.4 1.2-2.4 2.9-2.4 1.6 0 2.8.9 2.8 2.2 0 .4-.1.8-.6 1.1z" />
        </svg>
        Question
      </div>
      <p className="mb-4 text-[17px] leading-snug text-ink">{quiz.question}</p>
      <div className="space-y-2">
        {quiz.choices.map((choice, i) => {
          const isAnswer = i === quiz.answerIndex;
          const isPick = i === picked;
          let cls = "border-parchment-edge bg-[#fffdf8] hover:border-accent hover:bg-accent-soft";
          if (revealed && isAnswer) cls = "border-accent bg-accent-soft text-accent-deep font-medium";
          else if (revealed && isPick) cls = "border-[#c98b8b] bg-[#faeeee] text-[#8d3b3b]";
          else if (revealed) cls = "border-parchment-edge bg-parchment/50 text-ink-faint";
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={revealed}
              data-quiz-choice={i}
              className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-[15px] transition ${cls}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs opacity-70">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{choice}</span>
              {revealed && isAnswer && <span className="text-accent">✓</span>}
              {revealed && isPick && !isAnswer && <span className="text-[#a33]">✕</span>}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="mt-4 animate-rise rounded-lg border-l-[3px] border-accent bg-accent-soft/60 px-4 py-3">
          <p className="mb-1 text-sm font-semibold text-accent-deep">
            {picked === quiz.answerIndex ? "Correct." : "Not quite."}
          </p>
          <p className="text-[15px] leading-relaxed text-ink-soft">{quiz.explanation}</p>
        </div>
      )}
    </div>
  );
}

/** Loads the iframe only after a click, so a feed of videos stays light. */
export function VideoEmbed({
  embed,
  title,
}: {
  embed: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border border-parchment-edge bg-black">
        <iframe
          src={`${embed}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-parchment-edge bg-gradient-to-br from-[#26221c] to-[#10100e]"
    >
      <span className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_30%_30%,#1e6b5e,transparent_60%),radial-gradient(circle_at_70%_70%,#b4802a,transparent_60%)]" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:scale-105">
        <svg viewBox="0 0 24 24" fill="#16130f" className="ml-1 h-7 w-7">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="absolute bottom-3 left-4 right-4 text-left text-sm text-white/80">
        Tap to play
      </span>
    </button>
  );
}

export function CommentBox({ postId }: { postId: string }) {
  const [value, setValue] = useState("");
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      action={async (fd) => {
        const { addComment } = await import("@/app/actions");
        setValue("");
        start(async () => {
          await addComment(fd);
          router.refresh();
        });
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="body"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Add to the conversation. Sources welcome."
        className="w-full resize-none rounded-xl border border-parchment-edge bg-[#fffdf8] px-4 py-3 text-[15px] leading-relaxed text-ink outline-none transition placeholder:text-ink-faint focus:border-accent"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!value.trim() || pending}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Posting..." : "Comment"}
        </button>
      </div>
    </form>
  );
}
