"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json()) as { error?: string; redirectTo?: string };

    if (!response.ok) {
      setError(payload.error ?? "Login failed.");
      setIsSubmitting(false);
      return;
    }

    router.push(payload.redirectTo ?? "/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 text-white shadow-[0_30px_120px_rgba(7,24,39,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
        GymFlow admin access
      </p>
      <h1 className="mt-4 font-serif text-4xl">Sign in to admin panel</h1>
      <p className="mt-4 text-slate-300">
        Sign in with your GymFlow account to access the correct role-based dashboard.
      </p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-200">Email</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            placeholder="admin@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-200">Password</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <button
          className="w-full rounded-full bg-orange-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-orange-400 disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="mt-8 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">Quick access</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/member" className="rounded-full border border-white/10 px-4 py-2">
            Member dashboard
          </Link>
        </div>
      </div>
      <p className="mt-6 text-sm text-slate-400">
        New member?{" "}
        <Link href="/sign-up" className="font-semibold text-orange-200">
          Create account
        </Link>
      </p>
    </div>
  );
}
