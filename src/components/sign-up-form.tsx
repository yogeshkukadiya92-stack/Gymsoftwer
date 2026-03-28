"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [branch, setBranch] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        email,
        password,
        phone,
        fitnessGoal,
        branch,
      }),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setError(payload.error ?? "Sign-up failed.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(payload.message ?? "Account created.");
    setIsSubmitting(false);
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 text-white shadow-[0_30px_120px_rgba(7,24,39,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
        GymFlow member access
      </p>
      <h1 className="mt-4 font-serif text-4xl">Create your account</h1>
      <p className="mt-4 text-slate-300">
        Join as a member and access your workouts, schedule, and progress history.
      </p>
      <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="Phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="Fitness goal"
          value={fitnessGoal}
          onChange={(event) => setFitnessGoal(event.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          placeholder="Branch"
          value={branch}
          onChange={(event) => setBranch(event.target.value)}
        />
        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}
        <button
          className="w-full rounded-full bg-orange-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-orange-400 disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        Already have access?{" "}
        <Link href="/sign-in" className="font-semibold text-orange-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}
