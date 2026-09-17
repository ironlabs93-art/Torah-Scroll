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
      <span className="whitespace-nowrap text-[19px] font-semibold tracking-tight text-ink">Torah Scroll</span>
    </Link>
  );
}

export function TopBar({ user, isModerator = false }: { user: SessionUser | null; isModerator?: boolean }) {
  return (
    <header className="safe-top sticky top-0 z-30 border-b border-parchment-edge/80 bg-[#f6f1e7]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-4">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {isModerator && (
                <Link
                  href="/moderate"
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-parchment-edge px-2.5 py-1.5 text-sm text-ink-soft transition hover:border-accent hover:text-accent-deep sm:px-3"
                  title="Review queue"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                    <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" strokeLinejoin="round" />
                  </svg>
                  <span className="hidden sm:inline">Review</span>
                </Link>
              )}
              <Link
                href="/sources"
                className="hidden shrink-0 rounded-full border border-parchment-edge px-3 py-1.5 text-sm text-ink-soft transition hover:border-accent hover:text-accent-deep sm:block"
              >
                Channels
              </Link>
              <Link
                href="/compose"
                className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-accent-deep sm:px-4"
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
    <div className="hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent-soft to-[#eef5f2] p-5 lg:block">
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

export function CalendarStrip({ cal }: { cal: DailyLearning }) {
  return (
    <div className="mb-4 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent-soft to-[#eef5f2] px-4 py-3 lg:hidden">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">Today</p>
        <p className="hebrew text-[13px] text-accent-deep">{cal.hebrewDateHe}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        <Link href="/tag/daf-yomi" className="text-ink">
          <span className="text-ink-faint">Daf</span> {cal.dafYomi.display}
        </Link>
        {cal.mishnaYomi && (
          <Link href="/tag/mishnah-yomi" className="text-ink">
            <span className="text-ink-faint">Mishnah</span> {cal.mishnaYomi.display}
          </Link>
        )}
        {cal.parsha && cal.parshaSlug && (
          <Link href={`/tag/${cal.parshaSlug}`} className="text-ink">
            <span className="text-ink-faint">Parsha</span> {cal.parsha}
          </Link>
        )}
      </div>
      {cal.upcomingHolidays.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cal.upcomingHolidays.slice(0, 2).map((h) => (
            <Link
              key={h.slug}
              href={`/tag/${h.slug}`}
              className="rounded-full border border-gold/30 bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-[#7d5a1d]"
            >
              {h.label}
              <span className="ml-1 opacity-60">
                {h.daysAway === 0 ? "today" : `${h.daysAway}d`}
              </span>
            </Link>
          ))}
        </div>
      )}
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
