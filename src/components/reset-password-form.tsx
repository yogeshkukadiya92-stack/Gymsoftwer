"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.trim().length < 6) {
      setError("Please enter a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const payload = (await response.json()) as { error?: string; redirectTo?: string };

    if (!response.ok) {
      setError(payload.error ?? "Password reset failed.");
      setIsSubmitting(false);
      return;
    }

    router.push(payload.redirectTo ?? "/member");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 text-white shadow-[0_30px_120px_rgba(7,24,39,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
        First login security
      </p>
      <h1 className="mt-4 font-serif text-4xl">Set your new password</h1>
      <p className="mt-4 text-slate-300">
        Your account was created by the admin. Please change the default password before continuing.
      </p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="New password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        <button
          className="w-full rounded-full bg-orange-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-orange-400 disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
