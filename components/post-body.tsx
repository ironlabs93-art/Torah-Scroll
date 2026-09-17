"use client";

import { useEffect, useRef, useState } from "react";
import { isHebrewParagraph } from "@/lib/format";

/** Hebrew, plus the punctuation that travels with it. */
const HEBREW = /[֐-׿יִ-ﭏ]/;

/**
 * A paragraph counts as Hebrew when Hebrew letters outnumber Latin ones, not
 * merely when some appear: a English sentence quoting תיקו is still English and
 * must not flip to RTL.
 */
function isHebrew(paragraph: string): boolean {
  const hebrew = (paragraph.match(/[֐-׿]/g) ?? []).length;
  const latin = (paragraph.match(/[A-Za-z]/g) ?? []).length;
  return hebrew > 0 && hebrew >= latin;
}

function Paragraph({ text }: { text: string }) {
  if (!HEBREW.test(text)) return <p>{text}</p>;
  if (isHebrewParagraph(text)) {
    return (
      <p dir="rtl" className="hebrew text-[19px] leading-[1.9] sm:text-[20px]">
        {text}
      </p>
    );
  }
  return <p>{text}</p>;
}

/**
 * Only genuinely long posts collapse. A dvar Torah of a few hundred characters
 * should read whole in the feed; clamping those turns a feed of learning into a
 * list of headlines. A daf or a set of mishnayos runs several times this.
 */
const COLLAPSE_OVER_CHARS = 650;

export function PostBody({
  text,
  /** Post pages show the whole thing: you already chose to read it. */
  alwaysExpanded = false,
  /** Roughly five lines. A Gemara passage runs many times this. */
  collapsedHeight = "8.5em",
}: {
  text: string;
  alwaysExpanded?: boolean;
  collapsedHeight?: string;
}) {
  const collapsible = !alwaysExpanded && text.length > COLLAPSE_OVER_CHARS;
  const [expanded, setExpanded] = useState(!collapsible);
  // Assume it overflows until measured, so the control is present on first
  // paint and doesn't pop in after hydration.
  const [overflows, setOverflows] = useState(collapsible);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsible) return;
    const el = inner.current;
    if (!el) return;

    const measure = () => {
      const limit = parseFloat(collapsedHeight) * parseFloat(getComputedStyle(el).fontSize);
      setOverflows(el.scrollHeight > limit + 4);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, collapsible, collapsedHeight]);

  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const clamped = overflows && !expanded;

  return (
    <div className="text-[15.5px] leading-[1.6] text-ink-soft sm:text-[17px] sm:leading-[1.65]">
      <div
        ref={inner}
        className="relative space-y-3 overflow-hidden transition-[max-height] duration-200"
        style={clamped ? { maxHeight: collapsedHeight } : undefined}
        aria-hidden={false}
      >
        {paragraphs.map((p, i) => (
          <Paragraph key={i} text={p} />
        ))}

        {clamped && (
          // Fades the cut edge so it reads as "continues" rather than "ends".
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#fffdf8] to-transparent" />
        )}
      </div>

      {overflows && collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-accent-deep"
        >
          {expanded ? "Show less" : "Read more"}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
