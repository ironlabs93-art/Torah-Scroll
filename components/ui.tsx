import Link from "next/link";
import { initials } from "@/lib/format";

export function Avatar({
  name,
  hue,
  size = 44,
  verified,
}: {
  name: string;
  hue: number;
  size?: number;
  verified?: boolean;
}) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex items-center justify-center rounded-full font-semibold text-white"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.36,
          background: `linear-gradient(140deg, hsl(${hue} 42% 44%), hsl(${(hue + 40) % 360} 38% 32%))`,
        }}
      >
        {initials(name)}
      </span>
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-accent text-white ring-2 ring-parchment"
          style={{ width: size * 0.38, height: size * 0.38 }}
          title="Verified organization"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: size * 0.24 }}>
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </span>
  );
}

export function TagChip({ slug, label }: { slug: string; label: string }) {
  return (
    <Link
      href={`/tag/${slug}`}
      className="rounded-full border border-parchment-edge bg-parchment px-2.5 py-1 text-xs text-ink-soft transition hover:border-accent hover:bg-accent-soft hover:text-accent-deep"
    >
      {label}
    </Link>
  );
}

const REASON_STYLE: Record<string, string> = {
  calendar: "bg-accent-soft text-accent-deep border-accent/25",
  follow: "bg-gold-soft text-[#7d5a1d] border-gold/30",
  affinity: "bg-parchment-deep text-ink-soft border-parchment-edge",
  popular: "bg-parchment-deep text-ink-soft border-parchment-edge",
  fresh: "bg-parchment-deep text-ink-soft border-parchment-edge",
};

export function ReasonPill({ kind, label }: { kind: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        REASON_STYLE[kind] ?? REASON_STYLE.affinity
      }`}
    >
      {kind === "calendar" && (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zM4 8v7h12V8H4z" />
        </svg>
      )}
      {label}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-parchment-edge bg-[#fffdf8] shadow-[0_1px_2px_rgba(22,19,15,.04),0_8px_24px_-16px_rgba(22,19,15,.18)] ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-parchment-deep text-2xl">
        ✧
      </div>
      <h3 className="text-lg text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-faint">{body}</p>
    </Card>
  );
}
