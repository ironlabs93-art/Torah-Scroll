"use client";

import { useActionState } from "react";
import { signup, type ActionResult } from "@/app/actions";

const field =
  "w-full rounded-lg border border-parchment-edge bg-parchment/40 px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-accent focus:bg-white";

export function SignupForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(signup, {});

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="name" className="mb-1 block text-xs font-medium text-ink-soft">
          Name
        </label>
        <input id="name" name="name" required className={field} placeholder="Yosef Adler" />
      </div>
      <div>
        <label htmlFor="handle" className="mb-1 block text-xs font-medium text-ink-soft">
          Handle
        </label>
        <div className="flex items-center rounded-lg border border-parchment-edge bg-parchment/40 pl-3 focus-within:border-accent focus-within:bg-white">
          <span className="text-ink-faint">@</span>
          <input
            id="handle"
            name="handle"
            required
            pattern="[a-zA-Z0-9_]+"
            className="w-full bg-transparent px-1 py-2.5 text-[15px] text-ink outline-none"
            placeholder="yosefa"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium text-ink-soft">
          Email
        </label>
        <input id="email" name="email" type="email" required className={field} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium text-ink-soft">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={field}
          placeholder="At least 8 characters"
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
        {pending ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
