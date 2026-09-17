"use client";

import { useActionState } from "react";
import { login, type ActionResult } from "@/app/actions";

const field =
  "w-full rounded-lg border border-parchment-edge bg-parchment/40 px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-accent focus:bg-white";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(login, {});

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium text-ink-soft">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium text-ink-soft">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={field}
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-[#faeeee] px-3 py-2 text-sm text-[#8d3b3b]">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent py-2.5 font-medium text-white transition hover:bg-accent-deep disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
