"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="rounded-full border border-white/10 px-4 py-2 text-slate-100 transition hover:border-orange-300 hover:text-orange-100 disabled:opacity-60"
    >
      {isSubmitting ? "Logging out..." : "Logout"}
    </button>
  );
}
