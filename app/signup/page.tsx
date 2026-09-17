import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/shell";
import { SignupForm } from "./form";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm rounded-2xl border border-parchment-edge bg-[#fffdf8] p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">Start learning</h1>
        <p className="mb-6 mt-1 text-sm text-ink-faint">
          Pick your tracks next, and the feed builds itself around them.
        </p>
        <SignupForm />
      </div>
      <p className="mt-6 text-sm text-ink-faint">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
