import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyLearning } from "@/lib/calendar";
import { TopBar, CalendarPanel } from "@/components/shell";
import { Card } from "@/components/ui";
import { Composer } from "./composer";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tags = await db.tag.findMany({
    where: { kind: { in: ["TRACK", "HOLIDAY", "TOPIC"] } },
    orderBy: { label: "asc" },
    select: { slug: true, label: true, kind: true },
  });

  const cal = getDailyLearning();

  return (
    <>
      <TopBar user={user} />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <h1 className="mb-1 text-3xl font-semibold tracking-tight text-ink">Add to the feed</h1>
          <p className="mb-6 text-[16px] text-ink-soft">
            A thought, a question, a shiur, a diagram. Tag it well and it finds the people learning
            the same thing.
          </p>
          <Card className="p-6">
            <Composer tags={tags} />
          </Card>
        </main>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <CalendarPanel cal={cal} />
          <div className="rounded-2xl border border-gold/30 bg-gold-soft/50 p-5 text-sm leading-relaxed text-ink-soft">
            <p className="mb-2 font-semibold text-[#7d5a1d]">Tip</p>
            <p>
              If you&apos;re posting on today&apos;s daf, put{" "}
              <strong>{cal.dafYomi.work}</strong> in the Work field and{" "}
              <strong>{cal.dafYomi.ref}</strong> in Reference. It&apos;ll go straight to the top of
              the feed for everyone doing Daf Yomi today.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
