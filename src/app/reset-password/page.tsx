import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { getAuthenticatedProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const profile = await getAuthenticatedProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#08131f_0%,_#102235_100%)] px-6 py-20">
      <ResetPasswordForm />
    </div>
  );
}
