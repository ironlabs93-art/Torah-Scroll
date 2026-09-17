import Link from "next/link";
import { Avatar } from "./ui";
import { logout } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";
import type { DailyLearning } from "@/lib/calendar";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
          <path d="M7 4v16M17 4v16M7 6h10M7 18h10" strokeLinecap="round" />
          <path d="M9.5 9h5M9.5 12h5M9.5 15h3" strokeLinecap="round" opacity=".6" />
        </svg>
      </span>
      <span className="text-[19px] font-semibold tracking-tight text-ink">Torah Scroll</span>
    </Link>
  );
}

export function TopBar({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-parchment-edge/80 bg-[#f6f1e7]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/compose"
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-deep"
              >
                Post
              </Link>
              <Link href={`/u/${user.handle}`} className="ml-1">
                <Avatar name={user.name} hue={user.avatarHue} size={34} />
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full px-2 py-1.5 text-sm text-ink-faint transition hover:text-ink"
                  title="Sign out"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[18px] w-[18px]">
                    <path d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 01-2-2V6a2 2 0 012-2h6" strokeLinecap="round" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-sm text-ink-soft hover:text-ink">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-deep"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function CalendarPanel({ cal }: { cal: DailyLearning }) {
  return (
    <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent-soft to-[#eef5f2] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Today</p>
      <p className="mt-1.5 text-[17px] font-semibold text-ink">{cal.hebrewDate}</p>
      <p className="hebrew mt-0.5 text-[15px] text-accent-deep">{cal.hebrewDateHe}</p>

      <dl className="mt-4 space-y-3 border-t border-accent/15 pt-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-faint">Daf Yomi</dt>
          <dd className="mt-0.5 font-medium text-ink">
            <Link href={`/tag/daf-yomi`} className="hover:text-accent-deep hover:underline">
              {cal.dafYomi.display}
            </Link>
            <span className="hebrew ml-2 text-ink-faint">{cal.dafYomi.displayHe}</span>
          </dd>
        </div>
        {cal.mishnaYomi && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-faint">Mishnah Yomi</dt>
            <dd className="mt-0.5 font-medium text-ink">
              <Link href="/tag/mishnah-yomi" className="hover:text-accent-deep hover:underline">
                {cal.mishnaYomi.display}
              </Link>
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-faint">This week</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {cal.parsha ? (
              <Link href={`/tag/${cal.parshaSlug}`} className="hover:text-accent-deep hover:underline">
                Parshas {cal.parsha}
              </Link>
            ) : (
              "Festival reading"
            )}
          </dd>
        </div>
        {cal.upcomingHolidays.length > 0 && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-faint">Coming up</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {cal.upcomingHolidays.slice(0, 3).map((h) => (
                <Link
                  key={h.slug}
                  href={`/tag/${h.slug}`}
                  className="rounded-full border border-gold/30 bg-gold-soft px-2.5 py-1 text-xs font-medium text-[#7d5a1d] transition hover:border-gold"
                >
                  {h.label}
                  <span className="ml-1 opacity-60">
                    {h.daysAway === 0 ? "today" : `${h.daysAway}d`}
                  </span>
                </Link>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-parchment-edge bg-[#fffdf8] p-5">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h3>
      {children}
    </div>
  );
}
