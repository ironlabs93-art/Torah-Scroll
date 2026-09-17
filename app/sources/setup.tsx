"use client";

import { useActionState } from "react";
import { configureSource, type ActionResult } from "@/app/actions";

export function SourceSetup({
  source,
}: {
  source: { id: string; kind: string; feedRef: string | null; enabled: boolean };
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(configureSource, {});
  const isBuiltin = source.kind === "BUILTIN_TEXT";

  return (
    <form action={action} className="mt-4 border-t border-parchment-edge pt-4">
      <input type="hidden" name="sourceId" value={source.id} />
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        Moderator setup
      </p>

      {!isBuiltin && (
        <input
          name="feedRef"
          defaultValue={source.feedRef ?? ""}
          placeholder={
            source.kind === "YOUTUBE"
              ? "Channel id (UC...) or a /channel/UC... link"
              : "https://example.org/feed.xml"
          }
          className="mb-2 w-full rounded-lg border border-parchment-edge bg-parchment/40 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={source.enabled}
            className="accent-accent"
          />
          Enabled
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-deep disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        {state.error && <span className="text-xs text-[#8d3b3b]">{state.error}</span>}
        {state.ok && <span className="text-xs text-accent">Saved.</span>}
      </div>
    </form>
  );
}
