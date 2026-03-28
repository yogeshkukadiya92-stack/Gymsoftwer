"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(payload.error ?? "Reset request failed.");
      setIsSubmitting(false);
      return;
    }

    setMessage(payload.message ?? "Reset email sent.");
    setIsSubmitting(false);
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 text-white shadow-[0_30px_120px_rgba(7,24,39,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
        GymFlow account help
      </p>
      <h1 className="mt-4 font-serif text-4xl">Reset your password</h1>
      <p className="mt-4 text-slate-300">
        Enter your account email and we will send password reset instructions.
      </p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {message ? (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        <button
          className="w-full rounded-full bg-orange-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-orange-400 disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send reset email"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        Back to{" "}
        <Link href="/sign-in" className="font-semibold text-orange-200">
          sign in
        </Link>
      </p>
    </div>
  );
}
