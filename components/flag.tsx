"use client";

import { useActionState, useState } from "react";
import { flagPost, type ActionResult } from "@/app/actions";
import { FLAG_REASONS } from "@/lib/taxonomy";

export function FlagButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult, FormData>(flagPost, {});

  if (state.ok) {
    return (
      <span className="px-2.5 py-1.5 text-xs text-ink-faint" role="status">
        Reported. Thank you.
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full px-2.5 py-1.5 text-sm text-ink-faint transition hover:text-[#a33]"
        aria-label="Report this post"
        title="Report this post"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[17px] w-[17px]">
          <path d="M5 21V4M5 4h11l-1.5 3.5L16 11H5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  return (
    <form action={action} className="w-full space-y-2 rounded-xl border border-parchment-edge bg-parchment/50 p-3">
      <input type="hidden" name="postId" value={postId} />
      <p className="text-xs font-medium text-ink-soft">Why are you reporting this?</p>
      <div className="space-y-1">
        {FLAG_REASONS.map((r, i) => (
          <label key={r.value} className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="radio" name="reason" value={r.value} defaultChecked={i === 0} className="accent-accent" />
            {r.label}
          </label>
        ))}
      </div>
      <input
        name="note"
        placeholder="Anything a moderator should know (optional)"
        className="w-full rounded-lg border border-parchment-edge bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
      />
      {state.error && <p className="text-xs text-[#8d3b3b]">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#a33] px-4 py-1.5 text-xs font-medium text-white transition hover:bg-[#8d2c2c] disabled:opacity-50"
        >
          {pending ? "Sending..." : "Report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-parchment-edge px-4 py-1.5 text-xs text-ink-soft"
        >
          Cancel
        </button>
      </div>
      <p className="text-[11px] leading-snug text-ink-faint">
        Reporting sends this to a moderator. It doesn&apos;t hide the post on its own.
      </p>
    </form>
  );
}
