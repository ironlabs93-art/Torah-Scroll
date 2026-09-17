import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDailyLearning } from "@/lib/calendar";
import { Logo } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function Welcome() {
  if (await getCurrentUser()) redirect("/");
  const cal = getDailyLearning();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-16">
      <Logo className="mb-10" />

      <h1 className="max-w-xl text-[42px] font-semibold leading-[1.12] tracking-tight text-ink sm:text-[52px]">
        The scroll you don&apos;t have to feel bad about.
      </h1>
      <p className="mt-5 max-w-xl text-[19px] leading-relaxed text-ink-soft">
        A feed built out of Torah: divrei Torah, daily quizzes, shiurim, diagrams, from people
        and organizations learning the same things you are. Same pull as any other feed. Different
        thing at the bottom of it.
      </p>

      <div className="mt-8 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent-soft to-[#eef5f2] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          Right now, {cal.hebrewDate}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Daf Yomi</p>
            <p className="font-medium text-ink">{cal.dafYomi.display}</p>
          </div>
          {cal.mishnaYomi && (
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint">Mishnah Yomi</p>
              <p className="font-medium text-ink">{cal.mishnaYomi.display}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">This week</p>
            <p className="font-medium text-ink">
              {cal.parsha ? `Parshas ${cal.parsha}` : "Festival reading"}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-accent-deep">
          The feed knows what today is, so what you&apos;re already learning rises to the top.
        </p>
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Link
          href="/signup"
          className="rounded-full bg-accent px-7 py-3 font-medium text-white transition hover:bg-accent-deep"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-parchment-edge px-7 py-3 font-medium text-ink-soft transition hover:border-accent hover:text-accent-deep"
        >
          Sign in
        </Link>
      </div>
      <p className="mt-4 text-sm text-ink-faint">
        Trying it out? Sign in with{" "}
        <code className="rounded bg-parchment-deep px-1.5 py-0.5">demo@torahscroll.test</code> /{" "}
        <code className="rounded bg-parchment-deep px-1.5 py-0.5">demo1234</code>.
      </p>
    </div>
  );
}
