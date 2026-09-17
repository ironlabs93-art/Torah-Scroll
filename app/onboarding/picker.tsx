"use client";

import { useState } from "react";

type Tag = { slug: string; label: string; hebrew?: string };

function Group({
  title,
  hint,
  tags,
  selected,
  toggle,
}: {
  title: string;
  hint: string;
  tags: Tag[];
  selected: Set<string>;
  toggle: (slug: string) => void;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h2>
      <p className="mb-3 mt-1 text-sm text-ink-faint">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => {
          const on = selected.has(t.slug);
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => toggle(t.slug)}
              aria-pressed={on}
              className={`rounded-full border px-4 py-2 text-[15px] transition ${
                on
                  ? "border-accent bg-accent text-white"
                  : "border-parchment-edge bg-[#fffdf8] text-ink-soft hover:border-accent hover:text-accent-deep"
              }`}
            >
              {t.label}
              {t.hebrew && (
                <span className={`hebrew ml-2 text-sm ${on ? "opacity-70" : "text-ink-faint"}`}>
                  {t.hebrew}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function InterestPicker({ tracks, topics }: { tracks: Tag[]; topics: Tag[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  return (
    <>
      {[...selected].map((slug) => (
        <input key={slug} type="hidden" name="tags" value={slug} />
      ))}
      <Group
        title="Daily sedarim"
        hint="A cycle you're keeping, or want to start. The feed pins the right day to the top."
        tags={tracks}
        selected={selected}
        toggle={toggle}
      />
      <Group
        title="Topics"
        hint="What you'd stop scrolling for."
        tags={topics}
        selected={selected}
        toggle={toggle}
      />
      <p className="text-sm text-ink-faint">
        {selected.size === 0
          ? "Nothing picked yet."
          : `${selected.size} selected. We'll also follow a few accounts that post about these.`}
      </p>
    </>
  );
}
