import Link from "next/link";
import { Logo } from "@/components/shell";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-8" />
      <h1 className="text-3xl font-semibold text-ink">Not found</h1>
      <p className="mt-2 max-w-sm text-ink-soft">
        There is no daf 1 in any masechta either. Some things just start at two.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-accent px-6 py-2.5 font-medium text-white transition hover:bg-accent-deep"
      >
        Back to the feed
      </Link>
    </div>
  );
}
