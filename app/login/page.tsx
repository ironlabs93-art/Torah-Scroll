import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/shell";
import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm rounded-2xl border border-parchment-edge bg-[#fffdf8] p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
        <p className="mb-6 mt-1 text-sm text-ink-faint">Pick up where you left off.</p>
        <LoginForm />
      </div>

      <div className="mt-5 w-full max-w-sm rounded-xl border border-dashed border-gold/40 bg-gold-soft/50 p-4 text-sm">
        <p className="font-medium text-[#7d5a1d]">Demo account</p>
        <p className="mt-1 text-ink-soft">
          <code className="rounded bg-white/70 px-1.5 py-0.5">demo@torahscroll.test</code>
          {" / "}
          <code className="rounded bg-white/70 px-1.5 py-0.5">demo1234</code>
        </p>
        <p className="mt-1.5 text-xs text-ink-faint">
          Every seeded account uses the same password.
        </p>
      </div>

      <p className="mt-6 text-sm text-ink-faint">
        New here?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
