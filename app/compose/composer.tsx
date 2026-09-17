"use client";

import { useActionState, useState } from "react";
import { createPost, type ActionResult } from "@/app/actions";
import { POST_TYPES } from "@/lib/taxonomy";
import { parseVideo } from "@/lib/format";

type Tag = { slug: string; label: string; kind: string };

const field =
  "w-full rounded-lg border border-parchment-edge bg-parchment/40 px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-accent focus:bg-white";

const SAMPLE_DIAGRAMS = [
  { url: "/diagrams/sedarim.svg", label: "Six Sedarim" },
  { url: "/diagrams/daf-anatomy.svg", label: "Anatomy of a Daf" },
  { url: "/diagrams/arba-minim.svg", label: "Arba Minim" },
  { url: "/diagrams/yom-kippur-avodah.svg", label: "Yom Kippur Avodah" },
  { url: "/diagrams/chanukah-machlokes.svg", label: "Chanukah Machlokes" },
  { url: "/diagrams/shiras-haazinu.svg", label: "Shiras Ha'azinu" },
];

export function Composer({ tags }: { tags: Tag[] }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(createPost, {});
  const [type, setType] = useState<string>("TEXT");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [answerIndex, setAnswerIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const videoOk = videoUrl.trim() === "" ? null : Boolean(parseVideo(videoUrl));

  function toggleTag(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  const grouped = {
    TRACK: tags.filter((t) => t.kind === "TRACK"),
    HOLIDAY: tags.filter((t) => t.kind === "HOLIDAY"),
    TOPIC: tags.filter((t) => t.kind === "TOPIC"),
  };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="type" value={type} />
      {[...selected].map((slug) => (
        <input key={slug} type="hidden" name="tags" value={slug} />
      ))}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {POST_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded-xl border p-3 text-left transition ${
              type === t.value
                ? "border-accent bg-accent-soft"
                : "border-parchment-edge bg-[#fffdf8] hover:border-accent/50"
            }`}
          >
            <span
              className={`block text-[15px] font-semibold ${
                type === t.value ? "text-accent-deep" : "text-ink"
              }`}
            >
              {t.label}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-ink-faint">{t.blurb}</span>
          </button>
        ))}
      </div>

      {type !== "QUIZ" && (
        <div>
          <label htmlFor="title" className="mb-1 block text-xs font-medium text-ink-soft">
            Title <span className="text-ink-faint">(optional)</span>
          </label>
          <input id="title" name="title" className={field} placeholder="Give it a headline" />
        </div>
      )}

      {type === "QUIZ" ? (
        <div className="space-y-4 rounded-xl border border-parchment-edge bg-parchment/40 p-4">
          <div>
            <label htmlFor="question" className="mb-1 block text-xs font-medium text-ink-soft">
              Question
            </label>
            <input
              id="question"
              name="question"
              className={field}
              placeholder="How many masechtos are in the Mishnah?"
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-ink-soft">
              Choices. Click the circle to mark the right answer
            </legend>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAnswerIndex(i)}
                    aria-label={`Mark choice ${String.fromCharCode(65 + i)} correct`}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                      answerIndex === i
                        ? "border-accent bg-accent text-white"
                        : "border-parchment-edge bg-white text-ink-faint hover:border-accent"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </button>
                  <input
                    name={`choice${i}`}
                    className={field}
                    placeholder={i < 2 ? `Choice ${String.fromCharCode(65 + i)}` : "Optional"}
                  />
                </div>
              ))}
            </div>
            <input type="hidden" name="answerIndex" value={answerIndex} />
          </fieldset>
          <div>
            <label htmlFor="explanation" className="mb-1 block text-xs font-medium text-ink-soft">
              Explanation, shown after they answer
            </label>
            <textarea
              id="explanation"
              name="explanation"
              rows={3}
              className={`${field} resize-none`}
              placeholder="Cite the source. This is the part people actually learn from."
            />
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="body" className="mb-1 block text-xs font-medium text-ink-soft">
            {type === "TEXT" ? "Your dvar Torah" : "Notes"}
          </label>
          <textarea
            id="body"
            name="body"
            rows={type === "TEXT" ? 8 : 4}
            className={`${field} resize-none leading-relaxed`}
            placeholder={
              type === "TEXT"
                ? "What did you see in it?"
                : "A line or two of context for what you're sharing."
            }
          />
        </div>
      )}

      {type === "VIDEO" && (
        <div>
          <label htmlFor="videoUrl" className="mb-1 block text-xs font-medium text-ink-soft">
            Video link
          </label>
          <input
            id="videoUrl"
            name="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className={field}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {videoOk === false && (
            <p className="mt-1.5 text-xs text-[#8d3b3b]">
              We can embed YouTube and Vimeo links. That one won&apos;t play inline.
            </p>
          )}
          {videoOk === true && (
            <p className="mt-1.5 text-xs text-accent">Looks good. This will play in the feed.</p>
          )}
        </div>
      )}

      {type === "IMAGE" && (
        <div className="space-y-3">
          <div>
            <label htmlFor="imageUrl" className="mb-1 block text-xs font-medium text-ink-soft">
              Image URL
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={field}
              placeholder="/diagrams/sedarim.svg or https://..."
            />
          </div>
          <div>
            <p className="mb-2 text-xs text-ink-faint">Or use one of the sample diagrams:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_DIAGRAMS.map((d) => (
                <button
                  key={d.url}
                  type="button"
                  onClick={() => setImageUrl(d.url)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    imageUrl === d.url
                      ? "border-accent bg-accent text-white"
                      : "border-parchment-edge bg-[#fffdf8] text-ink-soft hover:border-accent"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="imageAlt" className="mb-1 block text-xs font-medium text-ink-soft">
              Describe the image
            </label>
            <input
              id="imageAlt"
              name="imageAlt"
              className={field}
              placeholder="So it's readable to someone using a screen reader"
            />
          </div>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full rounded-xl border border-parchment-edge bg-parchment"
            />
          )}
        </div>
      )}

      <div className="rounded-xl border border-parchment-edge bg-parchment/40 p-4">
        <p className="mb-3 text-xs font-medium text-ink-soft">
          Where does this sit in Torah?{" "}
          <span className="text-ink-faint">
            Tagging the source is what lets the feed match it to today&apos;s daf or mishnah.
          </span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="sourceWork" className="mb-1 block text-xs text-ink-faint">
              Work
            </label>
            <input id="sourceWork" name="sourceWork" className={field} placeholder="Berakhot" />
          </div>
          <div>
            <label htmlFor="sourceRef" className="mb-1 block text-xs text-ink-faint">
              Reference
            </label>
            <input id="sourceRef" name="sourceRef" className={field} placeholder="2a  or  1:3" />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium text-ink-soft">Tags</p>
        {(["TRACK", "HOLIDAY", "TOPIC"] as const).map((kind) => (
          <div key={kind} className="mb-3">
            <p className="mb-1.5 text-[11px] uppercase tracking-wider text-ink-faint">
              {kind === "TRACK" ? "Sedarim" : kind === "HOLIDAY" ? "Times of year" : "Topics"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {grouped[kind].map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggleTag(t.slug)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    selected.has(t.slug)
                      ? "border-accent bg-accent text-white"
                      : "border-parchment-edge bg-[#fffdf8] text-ink-soft hover:border-accent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {state.error && (
        <p className="rounded-lg bg-[#faeeee] px-4 py-3 text-sm text-[#8d3b3b]">{state.error}</p>
      )}

      <div className="flex items-center gap-4 border-t border-parchment-edge pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-7 py-2.5 font-medium text-white transition hover:bg-accent-deep disabled:opacity-50"
        >
          {pending ? "Posting..." : "Post to the feed"}
        </button>
        <p className="text-xs text-ink-faint">
          Posts go live immediately in this POC. Graduated exposure comes later.
        </p>
      </div>
    </form>
  );
}
