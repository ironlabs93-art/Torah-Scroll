import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { saveInterests } from "@/app/actions";
import { TRACKS, TOPICS } from "@/lib/taxonomy";
import { Logo } from "@/components/shell";
import { InterestPicker } from "./picker";

export const dynamic = "force-dynamic";

export default async function Onboarding() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Logo className="mb-10" />
      <h1 className="text-3xl font-semibold tracking-tight text-ink">What are you learning?</h1>
      <p className="mb-8 mt-2 text-[17px] leading-relaxed text-ink-soft">
        Pick whatever is true today. This seeds the feed, and it keeps adjusting as you read, heart
        and answer things, and you can change it any time by following different accounts.
      </p>

      <form action={saveInterests}>
        <InterestPicker tracks={[...TRACKS]} topics={[...TOPICS]} />
        <div className="mt-8 flex items-center gap-4">
          <button
            type="submit"
            className="rounded-full bg-accent px-7 py-3 font-medium text-white transition hover:bg-accent-deep"
          >
            Build my feed
          </button>
          <span className="text-sm text-ink-faint">You can skip and pick later.</span>
        </div>
      </form>
    </div>
  );
}
